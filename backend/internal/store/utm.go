package store

import (
	"context"
	"fmt"
	"time"

	"github.com/shopspring/decimal"
)

// RecordUTMVisit stores a single campaign landing (ad click). Visits are
// anonymous: attribution_id is the client-generated id from the recv_attr
// cookie so unique visitors can be estimated without cross-site tracking.
func (s *Store) RecordUTMVisit(ctx context.Context, attr AttributionInput) error {
	if attributionIsEmpty(attr) {
		return nil
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO utm_visits (attribution_id, source, medium, campaign, term, content, landing_path, referrer)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, limitString(attr.AttributionID, 160), limitString(attr.Source, 160), limitString(attr.Medium, 160), limitString(attr.Campaign, 240), limitString(attr.Term, 240), limitString(attr.Content, 240), limitString(attr.LandingPath, 500), limitString(attr.Referrer, 500))
	if err != nil {
		return fmt.Errorf("record utm visit: %w", err)
	}
	return nil
}

type UTMCampaignStats struct {
	Source           string          `json:"source"`
	Medium           string          `json:"medium"`
	Campaign         string          `json:"campaign"`
	Visits           int64           `json:"visits"`
	UniqueVisitors   int64           `json:"unique_visitors"`
	Signups          int64           `json:"signups"`
	PayingWorkspaces int64           `json:"paying_workspaces"`
	PaidUSD          decimal.Decimal `json:"paid_usd"`
}

type UTMReport struct {
	From      time.Time          `json:"from"`
	To        time.Time          `json:"to"`
	Campaigns []UTMCampaignStats `json:"campaigns"`
}

// GetUTMReport aggregates the acquisition funnel per (source, medium,
// campaign): ad clicks from utm_visits, signups from utm_attributions and
// subscription revenue from invoices of the attributed workspaces. A workspace
// is attributed to its earliest recorded touch.
func (s *Store) GetUTMReport(ctx context.Context, from, to time.Time) (UTMReport, error) {
	if to.IsZero() {
		to = time.Now().UTC()
	}
	if from.IsZero() {
		from = to.AddDate(0, 0, -28)
	}

	rows, err := s.pool.Query(ctx, `
		WITH visits AS (
			SELECT source, medium, campaign,
			       COUNT(*) AS visits,
			       COUNT(DISTINCT NULLIF(attribution_id, '')) AS unique_visitors
			FROM utm_visits
			WHERE created_at >= $1 AND created_at < $2
			GROUP BY source, medium, campaign
		), attributed AS (
			SELECT DISTINCT ON (workspace_id) workspace_id, source, medium, campaign
			FROM utm_attributions
			WHERE workspace_id IS NOT NULL AND created_at >= $1 AND created_at < $2
			ORDER BY workspace_id, created_at ASC
		), signups AS (
			SELECT a.source, a.medium, a.campaign,
			       COUNT(*) AS signups,
			       COUNT(p.workspace_id) AS paying_workspaces,
			       COALESCE(SUM(p.paid_usd), 0) AS paid_usd
			FROM attributed a
			LEFT JOIN (
				SELECT workspace_id, SUM(base_amount_usd) AS paid_usd
				FROM invoices
				WHERE kind = 'subscription' AND status IN ('paid', 'overpaid')
				GROUP BY workspace_id
			) p ON p.workspace_id = a.workspace_id
			GROUP BY a.source, a.medium, a.campaign
		)
		SELECT source, medium, campaign,
		       COALESCE(v.visits, 0),
		       COALESCE(v.unique_visitors, 0),
		       COALESCE(s.signups, 0),
		       COALESCE(s.paying_workspaces, 0),
		       COALESCE(s.paid_usd, 0)
		FROM visits v
		FULL OUTER JOIN signups s USING (source, medium, campaign)
		ORDER BY COALESCE(s.paid_usd, 0) DESC, COALESCE(s.signups, 0) DESC, COALESCE(v.visits, 0) DESC
	`, from, to)
	if err != nil {
		return UTMReport{}, fmt.Errorf("get utm report: %w", err)
	}
	defer rows.Close()

	report := UTMReport{From: from, To: to, Campaigns: []UTMCampaignStats{}}
	for rows.Next() {
		var item UTMCampaignStats
		if err := rows.Scan(&item.Source, &item.Medium, &item.Campaign, &item.Visits, &item.UniqueVisitors, &item.Signups, &item.PayingWorkspaces, &item.PaidUSD); err != nil {
			return UTMReport{}, fmt.Errorf("scan utm campaign stats: %w", err)
		}
		report.Campaigns = append(report.Campaigns, item)
	}
	if err := rows.Err(); err != nil {
		return UTMReport{}, fmt.Errorf("iterate utm campaign stats: %w", err)
	}
	return report, nil
}
