package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"reqst/backend/internal/metrics"

	"github.com/jackc/pgx/v5"
	"github.com/shopspring/decimal"
)

type AdminWorkspaceRecord struct {
	Workspace            Workspace       `json:"workspace"`
	InvoicesTotal        int             `json:"invoices_total"`
	PaidInvoices         int             `json:"paid_invoices"`
	GrossPaidUSD         decimal.Decimal `json:"gross_paid_usd"`
	LastInvoiceAt        *time.Time      `json:"last_invoice_at"`
	WebhookEndpoints     int             `json:"webhook_endpoints"`
	ActiveAPIKeys        int             `json:"active_api_keys"`
	ManualReviewInvoices int             `json:"manual_review_invoices"`
}

type AdminWebhookDeliveryRecord struct {
	WebhookDelivery
	EndpointLabel     string `json:"endpoint_label"`
	EndpointURL       string `json:"endpoint_url"`
	WorkspaceUsername string `json:"workspace_username"`
	WorkspaceEmail    string `json:"workspace_email"`
}

type AdminWatcherRecord struct {
	PollNetwork        Network    `json:"poll_network"`
	PayableNetwork     Network    `json:"payable_network"`
	DestinationAddress string     `json:"destination_address"`
	LastBlock          int64      `json:"last_block"`
	LastObservedAt     *time.Time `json:"last_observed_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
	FreshnessSeconds   int64      `json:"freshness_seconds"`
}

type AdminNotificationHealth struct {
	PendingTotal            int   `json:"pending_total"`
	ProcessingTotal         int   `json:"processing_total"`
	FailedTotal             int   `json:"failed_total"`
	Sent24h                 int   `json:"sent_24h"`
	OldestPendingAgeSeconds int64 `json:"oldest_pending_age_seconds"`
}

type AdminAnalytics struct {
	From              time.Time                 `json:"from"`
	To                time.Time                 `json:"to"`
	GroupBy           string                    `json:"group_by"`
	MRRUSD            decimal.Decimal           `json:"mrr_usd"`
	ARRUSD            decimal.Decimal           `json:"arr_usd"`
	PaidVolumeUSD     decimal.Decimal           `json:"paid_volume_usd"`
	ActiveWorkspaces  int                       `json:"active_workspaces"`
	CreatedInvoices   int                       `json:"created_invoices"`
	PaidInvoices      int                       `json:"paid_invoices"`
	FailedWebhookRate decimal.Decimal           `json:"failed_webhook_rate"`
	ManualReviewRate  decimal.Decimal           `json:"manual_review_rate"`
	UnderpaidShare    decimal.Decimal           `json:"underpaid_share"`
	Breakdown         []AdminAnalyticsBreakdown `json:"breakdown"`
}

type AdminAnalyticsBreakdown struct {
	Bucket               string          `json:"bucket"`
	CreatedInvoices      int             `json:"created_invoices"`
	PaidInvoices         int             `json:"paid_invoices"`
	ManualReviewInvoices int             `json:"manual_review_invoices"`
	UnderpaidInvoices    int             `json:"underpaid_invoices"`
	PaidVolumeUSD        decimal.Decimal `json:"paid_volume_usd"`
}

type AdminInternalComment struct {
	ID         int64     `json:"id"`
	TargetType string    `json:"target_type"`
	TargetID   string    `json:"target_id"`
	Body       string    `json:"body"`
	Author     string    `json:"author"`
	CreatedAt  time.Time `json:"created_at"`
}

type SEOTarget struct {
	ID                   int64     `json:"id"`
	KeywordCluster       string    `json:"keyword_cluster"`
	TargetPage           string    `json:"target_page"`
	PublishStatus        string    `json:"publish_status"`
	IndexStatus          string    `json:"index_status"`
	InternalLinksCount   int       `json:"internal_links_count"`
	VideoAttached        bool      `json:"video_attached"`
	ComparisonPageStatus string    `json:"comparison_page_status"`
	Notes                string    `json:"notes"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

func (s *Store) ListAdminWorkspaces(ctx context.Context, limit int) ([]AdminWorkspaceRecord, error) {
	if limit <= 0 || limit > 200 {
		limit = 100
	}
	rows, err := s.pool.Query(ctx, `
		SELECT workspaces.id,
		       workspaces.owner_telegram_id,
		       COALESCE(workspaces.username, ''),
		       COALESCE(workspaces.email, ''),
		       workspaces.default_network,
		       workspaces.plan_code,
		       workspaces.subscription_ends_at,
		       workspaces.free_invoices_used,
		       workspaces.is_blocked,
		       workspaces.telegram_linked_at,
		       workspaces.created_at,
		       (SELECT COUNT(1) FROM invoices i WHERE i.workspace_id = workspaces.id),
		       (SELECT COUNT(1) FROM invoices i WHERE i.workspace_id = workspaces.id AND i.status = 'paid'),
		       (SELECT COALESCE(SUM(i.base_amount_usd), 0) FROM invoices i WHERE i.workspace_id = workspaces.id AND i.status = 'paid'),
		       (SELECT MAX(i.created_at) FROM invoices i WHERE i.workspace_id = workspaces.id),
		       (SELECT COUNT(1) FROM webhook_endpoints we WHERE we.workspace_id = workspaces.id AND we.is_active = TRUE),
		       (SELECT COUNT(1) FROM api_keys ak WHERE ak.workspace_id = workspaces.id AND ak.revoked_at IS NULL),
		       (SELECT COUNT(1) FROM invoices i WHERE i.workspace_id = workspaces.id AND i.status = 'manual_review')
		FROM workspaces
		ORDER BY (SELECT MAX(i.created_at) FROM invoices i WHERE i.workspace_id = workspaces.id) DESC NULLS LAST, workspaces.created_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, fmt.Errorf("list admin workspaces: %w", err)
	}
	defer rows.Close()

	items := make([]AdminWorkspaceRecord, 0, limit)
	for rows.Next() {
		var item AdminWorkspaceRecord
		var workspace Workspace
		var telegramID sql.NullInt64
		var lastInvoiceAt sql.NullTime
		if err := rows.Scan(
			&workspace.ID, &telegramID, &workspace.Username, &workspace.Email, &workspace.DefaultNetwork, &workspace.PlanCode,
			&workspace.SubscriptionEndsAt, &workspace.FreeInvoicesUsed, &workspace.IsBlocked, &workspace.TelegramLinkedAt, &workspace.CreatedAt,
			&item.InvoicesTotal, &item.PaidInvoices, &item.GrossPaidUSD, &lastInvoiceAt, &item.WebhookEndpoints, &item.ActiveAPIKeys, &item.ManualReviewInvoices,
		); err != nil {
			return nil, fmt.Errorf("scan admin workspace: %w", err)
		}
		if telegramID.Valid {
			value := telegramID.Int64
			workspace.OwnerTelegramID = &value
		}
		item.Workspace = workspace
		if lastInvoiceAt.Valid {
			item.LastInvoiceAt = &lastInvoiceAt.Time
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) ListAdminFailedWebhooks(ctx context.Context, limit int) ([]AdminWebhookDeliveryRecord, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	rows, err := s.pool.Query(ctx, `
		SELECT d.id, d.event_id, d.endpoint_id, d.workspace_id, e.url, d.event_type, d.payload, d.status, d.attempts, d.max_attempts,
		       d.available_at, d.last_http_status, d.last_error, d.created_at, d.sent_at, d.resend_of,
		       e.label, e.url, COALESCE(w.username, ''), COALESCE(w.email, '')
		FROM webhook_deliveries d
		JOIN webhook_endpoints e ON e.id = d.endpoint_id
		JOIN workspaces w ON w.id = d.workspace_id
		WHERE d.status IN ('failed', 'exhausted', 'retrying')
		ORDER BY d.created_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, fmt.Errorf("list admin failed webhooks: %w", err)
	}
	defer rows.Close()

	items := make([]AdminWebhookDeliveryRecord, 0, limit)
	for rows.Next() {
		var item AdminWebhookDeliveryRecord
		if err := rows.Scan(
			&item.ID, &item.EventID, &item.EndpointID, &item.WorkspaceID, &item.TargetURL, &item.EventType, &item.Payload, &item.Status, &item.Attempts, &item.MaxAttempts,
			&item.AvailableAt, &item.LastHTTPStatus, &item.LastError, &item.CreatedAt, &item.SentAt, &item.ResendOf,
			&item.EndpointLabel, &item.EndpointURL, &item.WorkspaceUsername, &item.WorkspaceEmail,
		); err != nil {
			return nil, fmt.Errorf("scan admin failed webhook: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) ListAdminWatchers(ctx context.Context) ([]AdminWatcherRecord, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT poll_network, payable_network, destination_address, last_block, last_observed_at, updated_at
		FROM watcher_checkpoints
		ORDER BY updated_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("list admin watchers: %w", err)
	}
	defer rows.Close()

	now := time.Now().UTC()
	var items []AdminWatcherRecord
	for rows.Next() {
		var item AdminWatcherRecord
		if err := rows.Scan(&item.PollNetwork, &item.PayableNetwork, &item.DestinationAddress, &item.LastBlock, &item.LastObservedAt, &item.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan admin watcher: %w", err)
		}
		item.FreshnessSeconds = int64(now.Sub(item.UpdatedAt).Seconds())
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) GetAdminNotificationHealth(ctx context.Context) (AdminNotificationHealth, error) {
	var item AdminNotificationHealth
	var oldestPending sql.NullTime
	if err := s.pool.QueryRow(ctx, `
		SELECT
			COUNT(1) FILTER (WHERE status = 'pending'),
			COUNT(1) FILTER (WHERE status = 'processing'),
			COUNT(1) FILTER (WHERE status = 'failed'),
			COUNT(1) FILTER (WHERE status = 'sent' AND sent_at >= NOW() - INTERVAL '24 hours'),
			MIN(created_at) FILTER (WHERE status IN ('pending', 'failed'))
		FROM notification_outbox
	`).Scan(&item.PendingTotal, &item.ProcessingTotal, &item.FailedTotal, &item.Sent24h, &oldestPending); err != nil {
		return AdminNotificationHealth{}, fmt.Errorf("get admin notification health: %w", err)
	}
	if oldestPending.Valid {
		item.OldestPendingAgeSeconds = int64(time.Since(oldestPending.Time).Seconds())
	}
	return item, nil
}

func (s *Store) SetWorkspacePlan(ctx context.Context, workspaceID int64, planCode PlanCode, days int, subscriptionEndsAt *time.Time) (Workspace, error) {
	normalized := NormalizePlanCode(string(planCode))
	if normalized == PlanCodeTrial {
		subscriptionEndsAt = nil
	} else if subscriptionEndsAt == nil {
		if days <= 0 {
			days = ResolvePlan(normalized).BillingDays
		}
		if days <= 0 {
			days = 30
		}
		ends := time.Now().UTC().AddDate(0, 0, days)
		subscriptionEndsAt = &ends
	}
	row := s.pool.QueryRow(ctx, `
		UPDATE workspaces
		SET plan_code = $2,
		    subscription_ends_at = $3
		WHERE id = $1
		RETURNING `+workspaceSelectColumns+`
	`, workspaceID, normalized, subscriptionEndsAt)
	workspace, err := scanWorkspace(row)
	if err != nil {
		return Workspace{}, err
	}
	metrics.IncResourceOperation("workspace_subscription", "set_plan", "success")
	return workspace, nil
}

func (s *Store) ResendAdminWebhookDelivery(ctx context.Context, deliveryID int64) (WebhookDelivery, error) {
	var workspaceID int64
	if err := s.pool.QueryRow(ctx, `SELECT workspace_id FROM webhook_deliveries WHERE id = $1`, deliveryID).Scan(&workspaceID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return WebhookDelivery{}, ErrNotFound
		}
		return WebhookDelivery{}, fmt.Errorf("load webhook delivery workspace: %w", err)
	}
	return s.ResendWebhookDelivery(ctx, workspaceID, deliveryID)
}

func (s *Store) ReviewAdminInvoice(ctx context.Context, invoiceID int64, result string, comment string, actor string) (Invoice, string, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Invoice{}, "", fmt.Errorf("begin admin invoice review tx: %w", err)
	}
	defer tx.Rollback(ctx)

	row := tx.QueryRow(ctx, `SELECT `+invoiceSelectColumns+` FROM invoices WHERE id = $1 FOR UPDATE`, invoiceID)
	current, err := scanInvoice(row)
	if err != nil {
		return Invoice{}, "", err
	}
	if current.Status != InvoiceStatusManualReview {
		return Invoice{}, "", fmt.Errorf("invoice is %s, not manual_review", current.Status)
	}

	switch result {
	case "mark_paid":
		row = tx.QueryRow(ctx, `
			UPDATE invoices
			SET status = 'paid',
			    paid_at = COALESCE(paid_at, NOW()),
			    received_amount = GREATEST(received_amount, payable_amount),
			    finalized_at = COALESCE(finalized_at, NOW()),
			    review_reason = NULL
			WHERE id = $1
			RETURNING `+invoiceSelectColumns+`
		`, invoiceID)
		invoice, err := scanInvoice(row)
		if err != nil {
			return Invoice{}, "", err
		}
		if err := applyInvoicePostPaymentEffects(ctx, tx, invoice); err != nil {
			return Invoice{}, "", err
		}
		transitionID, err := insertInvoiceTransitionTx(ctx, tx, invoice, current.Status, invoice.Status, "admin_review_mark_paid", 0, invoice.PayableAmount, invoice.PayableAmount, "admin", actor)
		if err != nil {
			return Invoice{}, "", err
		}
		if err := enqueueWebhookEventsTx(ctx, tx, invoice, "admin_review_mark_paid", invoice.PayableAmount, transitionID); err != nil {
			return Invoice{}, "", err
		}
		if err := tx.Commit(ctx); err != nil {
			return Invoice{}, "", fmt.Errorf("commit admin review mark paid: %w", err)
		}
		return invoice, "Invoice marked paid and post-payment effects were applied.", nil
	case "keep_manual_review":
		row = tx.QueryRow(ctx, `
			UPDATE invoices
			SET review_reason = NULLIF($2, '')
			WHERE id = $1
			RETURNING `+invoiceSelectColumns+`
		`, invoiceID, strings.TrimSpace(comment))
	case "expire":
		row = tx.QueryRow(ctx, `
			UPDATE invoices
			SET status = 'expired',
			    finalized_at = COALESCE(finalized_at, NOW()),
			    review_reason = NULLIF($2, '')
			WHERE id = $1
			RETURNING `+invoiceSelectColumns+`
		`, invoiceID, strings.TrimSpace(comment))
	default:
		return Invoice{}, "", fmt.Errorf("invalid review result")
	}

	invoice, err := scanInvoice(row)
	if err != nil {
		return Invoice{}, "", err
	}
	if result == "expire" {
		if _, err := insertInvoiceTransitionTx(ctx, tx, invoice, current.Status, invoice.Status, "admin_review_expire", 0, decimal.Zero, invoice.ReceivedAmount, "admin", actor); err != nil {
			return Invoice{}, "", err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return Invoice{}, "", fmt.Errorf("commit admin invoice review: %w", err)
	}
	if result == "expire" {
		return invoice, "Invoice expired from manual review.", nil
	}
	return invoice, "Invoice kept in manual review.", nil
}

func (s *Store) RefreshAdminInvoiceStatus(ctx context.Context, invoiceID int64) (Invoice, string, error) {
	_, _ = s.ExpireOverdueInvoices(ctx)
	row := s.pool.QueryRow(ctx, `SELECT `+invoiceSelectColumns+` FROM invoices WHERE id = $1`, invoiceID)
	invoice, err := scanInvoice(row)
	if err != nil {
		return Invoice{}, "", err
	}
	return invoice, "Invoice status refreshed from stored payment state.", nil
}

func (s *Store) CreateAdminInternalComment(ctx context.Context, targetType string, targetID string, body string, author string) (AdminInternalComment, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO admin_internal_comments (target_type, target_id, body, author)
		VALUES ($1, $2, $3, $4)
		RETURNING id, target_type, target_id, body, author, created_at
	`, strings.TrimSpace(targetType), strings.TrimSpace(targetID), strings.TrimSpace(body), strings.TrimSpace(author))
	var item AdminInternalComment
	if err := row.Scan(&item.ID, &item.TargetType, &item.TargetID, &item.Body, &item.Author, &item.CreatedAt); err != nil {
		return AdminInternalComment{}, fmt.Errorf("create admin internal comment: %w", err)
	}
	return item, nil
}

func (s *Store) GetAdminAnalytics(ctx context.Context, from time.Time, to time.Time, groupBy string) (AdminAnalytics, error) {
	if groupBy == "" {
		groupBy = "date"
	}
	if from.IsZero() {
		from = time.Now().UTC().AddDate(0, 0, -30)
	}
	if to.IsZero() {
		to = time.Now().UTC()
	}
	item := AdminAnalytics{From: from, To: to, GroupBy: groupBy}
	if err := s.pool.QueryRow(ctx, `
		SELECT
			COALESCE(SUM(base_amount_usd) FILTER (WHERE status = 'paid'), 0),
			COUNT(DISTINCT workspace_id) FILTER (WHERE status = 'paid'),
			COUNT(1),
			COUNT(1) FILTER (WHERE status = 'paid'),
			COALESCE(COUNT(1) FILTER (WHERE status = 'manual_review')::numeric / NULLIF(COUNT(1), 0), 0),
			COALESCE(COUNT(1) FILTER (WHERE status = 'underpaid')::numeric / NULLIF(COUNT(1), 0), 0)
		FROM invoices
		WHERE created_at >= $1 AND created_at <= $2
	`, from, to).Scan(&item.PaidVolumeUSD, &item.ActiveWorkspaces, &item.CreatedInvoices, &item.PaidInvoices, &item.ManualReviewRate, &item.UnderpaidShare); err != nil {
		return AdminAnalytics{}, fmt.Errorf("get admin analytics summary: %w", err)
	}
	if err := s.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(
			CASE plan_code
				WHEN 'merchant' THEN 39
				WHEN 'developer' THEN 199
				WHEN 'business' THEN 499
				ELSE 0
			END
		), 0)
		FROM workspaces
		WHERE subscription_ends_at IS NOT NULL AND subscription_ends_at > NOW()
	`).Scan(&item.MRRUSD); err != nil {
		return AdminAnalytics{}, fmt.Errorf("get admin analytics mrr: %w", err)
	}
	item.ARRUSD = item.MRRUSD.Mul(decimal.NewFromInt(12))

	var totalWebhooks, failedWebhooks int
	if err := s.pool.QueryRow(ctx, `
		SELECT COUNT(1), COUNT(1) FILTER (WHERE status IN ('failed', 'exhausted'))
		FROM webhook_deliveries
		WHERE created_at >= $1 AND created_at <= $2
	`, from, to).Scan(&totalWebhooks, &failedWebhooks); err != nil {
		return AdminAnalytics{}, fmt.Errorf("get admin analytics webhooks: %w", err)
	}
	if totalWebhooks > 0 {
		item.FailedWebhookRate = decimal.NewFromInt(int64(failedWebhooks)).Div(decimal.NewFromInt(int64(totalWebhooks)))
	}

	breakdownExpr := analyticsBreakdownExpression(groupBy)
	rows, err := s.pool.Query(ctx, `
		SELECT `+breakdownExpr+` AS bucket,
		       COUNT(1),
		       COUNT(1) FILTER (WHERE status = 'paid'),
		       COUNT(1) FILTER (WHERE status = 'manual_review'),
		       COUNT(1) FILTER (WHERE status = 'underpaid'),
		       COALESCE(SUM(base_amount_usd) FILTER (WHERE status = 'paid'), 0)
		FROM invoices
		WHERE created_at >= $1 AND created_at <= $2
		GROUP BY bucket
		ORDER BY bucket ASC
	`, from, to)
	if err != nil {
		return AdminAnalytics{}, fmt.Errorf("get admin analytics breakdown: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var point AdminAnalyticsBreakdown
		if err := rows.Scan(&point.Bucket, &point.CreatedInvoices, &point.PaidInvoices, &point.ManualReviewInvoices, &point.UnderpaidInvoices, &point.PaidVolumeUSD); err != nil {
			return AdminAnalytics{}, fmt.Errorf("scan admin analytics breakdown: %w", err)
		}
		item.Breakdown = append(item.Breakdown, point)
	}
	return item, rows.Err()
}

func analyticsBreakdownExpression(groupBy string) string {
	switch groupBy {
	case "network":
		return "payable_network::text"
	case "plan":
		return "COALESCE(NULLIF(plan_code, ''), 'merchant')"
	case "mode":
		return "mode"
	default:
		return "to_char(date_trunc('day', created_at), 'YYYY-MM-DD')"
	}
}

func (s *Store) ListSEOTargets(ctx context.Context) ([]SEOTarget, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, keyword_cluster, target_page, publish_status, index_status, internal_links_count,
		       video_attached, comparison_page_status, COALESCE(notes, ''), created_at, updated_at
		FROM seo_targets
		ORDER BY updated_at DESC, id DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("list seo targets: %w", err)
	}
	defer rows.Close()
	var items []SEOTarget
	for rows.Next() {
		var item SEOTarget
		if err := rows.Scan(&item.ID, &item.KeywordCluster, &item.TargetPage, &item.PublishStatus, &item.IndexStatus, &item.InternalLinksCount, &item.VideoAttached, &item.ComparisonPageStatus, &item.Notes, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan seo target: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
