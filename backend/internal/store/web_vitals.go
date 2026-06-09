package store

import (
	"context"
	"fmt"
	"time"
)

type WebVital struct {
	MetricName     string    `json:"metric_name"`
	MetricValue    float64   `json:"metric_value"`
	Path           string    `json:"path"`
	Locale         string    `json:"locale"`
	NavigationType string    `json:"navigation_type"`
	RecordedAt     time.Time `json:"recorded_at"`
}

type WebVitalSummary struct {
	MetricName string  `json:"metric_name"`
	P75        float64 `json:"p75"`
	Samples    int64   `json:"samples"`
	Good       bool    `json:"good"`
}

type WebVitalsReport struct {
	From    time.Time         `json:"from"`
	To      time.Time         `json:"to"`
	Metrics []WebVitalSummary `json:"metrics"`
}

func (s *Store) RecordWebVital(ctx context.Context, vital WebVital) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO web_vitals (metric_name, metric_value, path, locale, navigation_type)
		VALUES ($1, $2, $3, $4, $5)
	`, vital.MetricName, vital.MetricValue, vital.Path, vital.Locale, vital.NavigationType)
	if err != nil {
		return fmt.Errorf("record web vital: %w", err)
	}
	return nil
}

func (s *Store) GetWebVitalsReport(ctx context.Context, from, to time.Time) (WebVitalsReport, error) {
	if to.IsZero() {
		to = time.Now().UTC()
	}
	if from.IsZero() {
		from = to.AddDate(0, 0, -28)
	}

	rows, err := s.pool.Query(ctx, `
		SELECT metric_name,
		       percentile_cont(0.75) WITHIN GROUP (ORDER BY metric_value)::DOUBLE PRECISION,
		       COUNT(*)
		FROM web_vitals
		WHERE recorded_at >= $1 AND recorded_at < $2
		GROUP BY metric_name
		ORDER BY metric_name
	`, from, to)
	if err != nil {
		return WebVitalsReport{}, fmt.Errorf("get web vitals report: %w", err)
	}
	defer rows.Close()

	report := WebVitalsReport{From: from, To: to, Metrics: []WebVitalSummary{}}
	for rows.Next() {
		var summary WebVitalSummary
		if err := rows.Scan(&summary.MetricName, &summary.P75, &summary.Samples); err != nil {
			return WebVitalsReport{}, fmt.Errorf("scan web vital summary: %w", err)
		}
		switch summary.MetricName {
		case "LCP":
			summary.Good = summary.P75 <= 2500
		case "INP":
			summary.Good = summary.P75 <= 200
		case "CLS":
			summary.Good = summary.P75 <= 0.1
		}
		report.Metrics = append(report.Metrics, summary)
	}
	if err := rows.Err(); err != nil {
		return WebVitalsReport{}, fmt.Errorf("iterate web vital summaries: %w", err)
	}
	return report, nil
}
