package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
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

type UTMEventInput struct {
	AttributionID string          `json:"attribution_id"`
	EventName     string          `json:"event_name"`
	Source        string          `json:"source"`
	Medium        string          `json:"medium"`
	Campaign      string          `json:"campaign"`
	Term          string          `json:"term"`
	Content       string          `json:"content"`
	Path          string          `json:"path"`
	Title         string          `json:"title"`
	Referrer      string          `json:"referrer"`
	Properties    json.RawMessage `json:"properties"`
}

func (s *Store) RecordUTMEvent(ctx context.Context, event UTMEventInput) error {
	if eventIsEmpty(event) {
		return nil
	}
	properties := event.Properties
	if len(properties) == 0 || !json.Valid(properties) {
		properties = json.RawMessage(`{}`)
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO utm_events (attribution_id, event_name, source, medium, campaign, term, content, path, title, referrer, properties)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`, limitString(event.AttributionID, 160), limitString(event.EventName, 160), limitString(event.Source, 160), limitString(event.Medium, 160), limitString(event.Campaign, 240), limitString(event.Term, 240), limitString(event.Content, 240), limitString(event.Path, 500), limitString(event.Title, 240), limitString(event.Referrer, 500), properties)
	if err != nil {
		return fmt.Errorf("record utm event: %w", err)
	}
	return nil
}

type UTMCampaignStats struct {
	Source           string          `json:"source"`
	Medium           string          `json:"medium"`
	Campaign         string          `json:"campaign"`
	Visits           int64           `json:"visits"`
	UniqueVisitors   int64           `json:"unique_visitors"`
	Events           int64           `json:"events"`
	DocsOpened       int64           `json:"docs_opened"`
	AppOpens         int64           `json:"app_opens"`
	BotOpens         int64           `json:"bot_opens"`
	SignupStarts     int64           `json:"signup_starts"`
	Signups          int64           `json:"signups"`
	PayingWorkspaces int64           `json:"paying_workspaces"`
	PaidUSD          decimal.Decimal `json:"paid_usd"`
}

type UTMPathStats struct {
	Path           string `json:"path"`
	Title          string `json:"title"`
	Visitors       int64  `json:"visitors"`
	Events         int64  `json:"events"`
	SignupVisitors int64  `json:"signup_visitors"`
}

type UTMLeadEvent struct {
	EventName string    `json:"event_name"`
	Path      string    `json:"path"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
}

type UTMLeadJourney struct {
	AttributionID  string         `json:"attribution_id"`
	Source         string         `json:"source"`
	Medium         string         `json:"medium"`
	Campaign       string         `json:"campaign"`
	Term           string         `json:"term"`
	Content        string         `json:"content"`
	LandingPath    string         `json:"landing_path"`
	Referrer       string         `json:"referrer"`
	FirstSeenAt    time.Time      `json:"first_seen_at"`
	LastSeenAt     time.Time      `json:"last_seen_at"`
	EventCount     int64          `json:"event_count"`
	DocsOpened     int64          `json:"docs_opened"`
	AppOpens       int64          `json:"app_opens"`
	SignupStarted  bool           `json:"signup_started"`
	WorkspaceID    *int64         `json:"workspace_id,omitempty"`
	WorkspaceName  string         `json:"workspace_name,omitempty"`
	WorkspaceEmail string         `json:"workspace_email,omitempty"`
	SignedUpAt     *time.Time     `json:"signed_up_at,omitempty"`
	Timeline       []UTMLeadEvent `json:"timeline"`
}

type UTMReport struct {
	From        time.Time          `json:"from"`
	To          time.Time          `json:"to"`
	Campaigns   []UTMCampaignStats `json:"campaigns"`
	TopLandings []UTMPathStats     `json:"top_landings"`
	TopPages    []UTMPathStats     `json:"top_pages"`
	TopDocs     []UTMPathStats     `json:"top_docs"`
	Leads       []UTMLeadJourney   `json:"leads"`
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
			       COUNT(DISTINCT NULLIF(attribution_id, '')) AS unique_visitors,
			       COUNT(*) FILTER (WHERE landing_path = '/tg-bot') AS bot_visits
			FROM utm_visits
			WHERE created_at >= $1 AND created_at < $2
			GROUP BY source, medium, campaign
		), events AS (
			SELECT source, medium, campaign,
			       COUNT(*) AS events,
			       COUNT(*) FILTER (WHERE event_name IN ('docs_open', 'docs_page_view')) AS docs_opened,
			       COUNT(*) FILTER (WHERE event_name = 'app_open') AS app_opens,
			       COUNT(*) FILTER (WHERE event_name = 'bot_open') AS bot_opens,
			       COUNT(*) FILTER (WHERE event_name = 'signup_start') AS signup_starts
			FROM utm_events
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
		), campaign_keys AS (
			SELECT source, medium, campaign FROM visits
			UNION
			SELECT source, medium, campaign FROM events
			UNION
			SELECT source, medium, campaign FROM signups
		)
		SELECT k.source, k.medium, k.campaign,
		       COALESCE(v.visits, 0),
		       COALESCE(v.unique_visitors, 0),
		       COALESCE(e.events, 0),
		       COALESCE(e.docs_opened, 0),
		       COALESCE(e.app_opens, 0),
		       COALESCE(e.bot_opens, 0) + COALESCE(v.bot_visits, 0),
		       COALESCE(e.signup_starts, 0),
		       COALESCE(s.signups, 0),
		       COALESCE(s.paying_workspaces, 0),
		       COALESCE(s.paid_usd, 0)
		FROM campaign_keys k
		LEFT JOIN visits v USING (source, medium, campaign)
		LEFT JOIN events e USING (source, medium, campaign)
		LEFT JOIN signups s USING (source, medium, campaign)
		ORDER BY COALESCE(s.paid_usd, 0) DESC, COALESCE(s.signups, 0) DESC, COALESCE(v.visits, 0) DESC
	`, from, to)
	if err != nil {
		return UTMReport{}, fmt.Errorf("get utm report: %w", err)
	}
	defer rows.Close()

	report := UTMReport{From: from, To: to, Campaigns: []UTMCampaignStats{}}
	for rows.Next() {
		var item UTMCampaignStats
		if err := rows.Scan(&item.Source, &item.Medium, &item.Campaign, &item.Visits, &item.UniqueVisitors, &item.Events, &item.DocsOpened, &item.AppOpens, &item.BotOpens, &item.SignupStarts, &item.Signups, &item.PayingWorkspaces, &item.PaidUSD); err != nil {
			return UTMReport{}, fmt.Errorf("scan utm campaign stats: %w", err)
		}
		report.Campaigns = append(report.Campaigns, item)
	}
	if err := rows.Err(); err != nil {
		return UTMReport{}, fmt.Errorf("iterate utm campaign stats: %w", err)
	}
	topLandings, err := s.getUTMLandingStats(ctx, from, to)
	if err != nil {
		return UTMReport{}, err
	}
	topPages, err := s.getUTMPathStats(ctx, from, to, false)
	if err != nil {
		return UTMReport{}, err
	}
	topDocs, err := s.getUTMPathStats(ctx, from, to, true)
	if err != nil {
		return UTMReport{}, err
	}
	leads, err := s.getUTMLeadJourneys(ctx, from, to)
	if err != nil {
		return UTMReport{}, err
	}
	report.TopLandings = topLandings
	report.TopPages = topPages
	report.TopDocs = topDocs
	report.Leads = leads
	return report, nil
}

func (s *Store) getUTMLandingStats(ctx context.Context, from, to time.Time) ([]UTMPathStats, error) {
	rows, err := s.pool.Query(ctx, `
		WITH signup_attrs AS (
			SELECT DISTINCT attribution_id
			FROM utm_attributions
			WHERE attribution_id <> '' AND created_at >= $1 AND created_at < $2
		)
		SELECT landing_path,
		       '' AS title,
		       COUNT(DISTINCT NULLIF(v.attribution_id, '')) AS visitors,
		       COUNT(*) AS visits,
		       COUNT(DISTINCT v.attribution_id) FILTER (WHERE s.attribution_id IS NOT NULL) AS signup_visitors
		FROM utm_visits v
		LEFT JOIN signup_attrs s ON s.attribution_id = v.attribution_id
		WHERE v.created_at >= $1 AND v.created_at < $2 AND landing_path <> ''
		GROUP BY landing_path
		ORDER BY visits DESC, visitors DESC
		LIMIT 12
	`, from, to)
	if err != nil {
		return nil, fmt.Errorf("get utm landing stats: %w", err)
	}
	defer rows.Close()

	items := []UTMPathStats{}
	for rows.Next() {
		var item UTMPathStats
		if err := rows.Scan(&item.Path, &item.Title, &item.Visitors, &item.Events, &item.SignupVisitors); err != nil {
			return nil, fmt.Errorf("scan utm landing stats: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate utm landing stats: %w", err)
	}
	return items, nil
}

func (s *Store) getUTMPathStats(ctx context.Context, from, to time.Time, docsOnly bool) ([]UTMPathStats, error) {
	filter := ""
	if docsOnly {
		filter = "AND (path LIKE '%/docs%' OR event_name IN ('docs_open', 'docs_page_view'))"
	}
	rows, err := s.pool.Query(ctx, fmt.Sprintf(`
		WITH signup_attrs AS (
			SELECT DISTINCT attribution_id
			FROM utm_attributions
			WHERE attribution_id <> '' AND created_at >= $1 AND created_at < $2
		)
		SELECT e.path,
		       MAX(e.title) AS title,
		       COUNT(DISTINCT NULLIF(e.attribution_id, '')) AS visitors,
		       COUNT(*) AS events,
		       COUNT(DISTINCT e.attribution_id) FILTER (WHERE s.attribution_id IS NOT NULL) AS signup_visitors
		FROM utm_events e
		LEFT JOIN signup_attrs s ON s.attribution_id = e.attribution_id
		WHERE e.created_at >= $1 AND e.created_at < $2 AND e.path <> '' %s
		GROUP BY e.path
		ORDER BY visitors DESC, events DESC
		LIMIT 12
	`, filter), from, to)
	if err != nil {
		return nil, fmt.Errorf("get utm path stats: %w", err)
	}
	defer rows.Close()

	items := []UTMPathStats{}
	for rows.Next() {
		var item UTMPathStats
		if err := rows.Scan(&item.Path, &item.Title, &item.Visitors, &item.Events, &item.SignupVisitors); err != nil {
			return nil, fmt.Errorf("scan utm path stats: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate utm path stats: %w", err)
	}
	return items, nil
}

func (s *Store) getUTMLeadJourneys(ctx context.Context, from, to time.Time) ([]UTMLeadJourney, error) {
	rows, err := s.pool.Query(ctx, `
		WITH lead_ids AS (
			SELECT attribution_id, MAX(created_at) AS last_seen_at
			FROM (
				SELECT attribution_id, created_at FROM utm_events WHERE attribution_id <> '' AND created_at >= $1 AND created_at < $2
				UNION ALL
				SELECT attribution_id, created_at FROM utm_visits WHERE attribution_id <> '' AND created_at >= $1 AND created_at < $2
				UNION ALL
				SELECT attribution_id, created_at FROM utm_attributions WHERE attribution_id <> '' AND created_at >= $1 AND created_at < $2
			) ids
			GROUP BY attribution_id
			ORDER BY last_seen_at DESC
			LIMIT 40
		), first_touch AS (
			SELECT DISTINCT ON (attribution_id) attribution_id, source, medium, campaign, term, content, landing_path, referrer, created_at
			FROM (
				SELECT attribution_id, source, medium, campaign, term, content, landing_path, referrer, created_at FROM utm_visits
				UNION ALL
				SELECT attribution_id, source, medium, campaign, term, content, landing_path, referrer, created_at FROM utm_attributions
			) touches
			WHERE attribution_id IN (SELECT attribution_id FROM lead_ids)
			ORDER BY attribution_id, created_at ASC
		), event_stats AS (
			SELECT attribution_id,
			       COUNT(*) AS event_count,
			       COUNT(*) FILTER (WHERE event_name IN ('docs_open', 'docs_page_view')) AS docs_opened,
			       COUNT(*) FILTER (WHERE event_name = 'app_open') AS app_opens,
			       BOOL_OR(event_name = 'signup_start') AS signup_started
			FROM utm_events
			WHERE attribution_id IN (SELECT attribution_id FROM lead_ids)
			GROUP BY attribution_id
		), signup AS (
			SELECT DISTINCT ON (a.attribution_id) a.attribution_id, a.workspace_id, w.username, w.email, a.created_at
			FROM utm_attributions a
			LEFT JOIN workspaces w ON w.id = a.workspace_id
			WHERE a.attribution_id IN (SELECT attribution_id FROM lead_ids) AND a.workspace_id IS NOT NULL
			ORDER BY a.attribution_id, a.created_at ASC
		)
		SELECT l.attribution_id,
		       COALESCE(f.source, ''), COALESCE(f.medium, ''), COALESCE(f.campaign, ''), COALESCE(f.term, ''), COALESCE(f.content, ''),
		       COALESCE(f.landing_path, ''), COALESCE(f.referrer, ''), COALESCE(f.created_at, l.last_seen_at), l.last_seen_at,
		       COALESCE(es.event_count, 0), COALESCE(es.docs_opened, 0), COALESCE(es.app_opens, 0), COALESCE(es.signup_started, false),
		       s.workspace_id, COALESCE(s.username, ''), COALESCE(s.email, ''), s.created_at
		FROM lead_ids l
		LEFT JOIN first_touch f ON f.attribution_id = l.attribution_id
		LEFT JOIN event_stats es ON es.attribution_id = l.attribution_id
		LEFT JOIN signup s ON s.attribution_id = l.attribution_id
		ORDER BY l.last_seen_at DESC
	`, from, to)
	if err != nil {
		return nil, fmt.Errorf("get utm lead journeys: %w", err)
	}
	defer rows.Close()

	leads := []UTMLeadJourney{}
	for rows.Next() {
		var item UTMLeadJourney
		var workspaceID sql.NullInt64
		var signedUpAt sql.NullTime
		if err := rows.Scan(&item.AttributionID, &item.Source, &item.Medium, &item.Campaign, &item.Term, &item.Content, &item.LandingPath, &item.Referrer, &item.FirstSeenAt, &item.LastSeenAt, &item.EventCount, &item.DocsOpened, &item.AppOpens, &item.SignupStarted, &workspaceID, &item.WorkspaceName, &item.WorkspaceEmail, &signedUpAt); err != nil {
			return nil, fmt.Errorf("scan utm lead journey: %w", err)
		}
		if workspaceID.Valid {
			item.WorkspaceID = &workspaceID.Int64
		}
		if signedUpAt.Valid {
			item.SignedUpAt = &signedUpAt.Time
		}
		leads = append(leads, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate utm lead journeys: %w", err)
	}

	for i := range leads {
		timeline, err := s.getUTMLeadTimeline(ctx, leads[i].AttributionID)
		if err != nil {
			return nil, err
		}
		leads[i].Timeline = timeline
	}
	return leads, nil
}

func (s *Store) getUTMLeadTimeline(ctx context.Context, attributionID string) ([]UTMLeadEvent, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT event_name, path, title, created_at
		FROM utm_events
		WHERE attribution_id = $1
		ORDER BY created_at ASC
		LIMIT 30
	`, attributionID)
	if err != nil {
		return nil, fmt.Errorf("get utm lead timeline: %w", err)
	}
	defer rows.Close()

	items := []UTMLeadEvent{}
	for rows.Next() {
		var item UTMLeadEvent
		if err := rows.Scan(&item.EventName, &item.Path, &item.Title, &item.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan utm lead timeline: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate utm lead timeline: %w", err)
	}
	return items, nil
}

func eventIsEmpty(event UTMEventInput) bool {
	return strings.TrimSpace(event.AttributionID+event.EventName+event.Path) == ""
}
