package store

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/shopspring/decimal"
)

type AdminOverview struct {
	GeneratedAt      time.Time
	Totals           AdminOverviewTotals
	DailySales       []AdminDailySalesPoint
	NetworkBreakdown []AdminNetworkBreakdown
	StatusBreakdown  []AdminStatusBreakdown
	PlanBreakdown    []AdminPlanBreakdown
	RecentSales      []AdminInvoiceRecord
}

type AdminOverviewTotals struct {
	InvoicesTotal         int
	PaidTotal             int
	AwaitingTotal         int
	UnderpaidTotal        int
	ManualReviewTotal     int
	ExpiredTotal          int
	MerchantPaidTotal     int
	SubscriptionPaidTotal int
	GrossPaidUSD          decimal.Decimal
	MerchantPaidUSD       decimal.Decimal
	SubscriptionPaidUSD   decimal.Decimal
	OpenInvoiceUSD        decimal.Decimal
	WorkspacesTotal       int
	ActiveSubscribers     int
	BlockedWorkspaces     int
	WalletsTotal          int
	APIKeysActive         int
	WebhookEndpoints      int
}

type AdminDailySalesPoint struct {
	Date                time.Time
	PaidUSD             decimal.Decimal
	MerchantPaidUSD     decimal.Decimal
	SubscriptionPaidUSD decimal.Decimal
	PaidCount           int
	CreatedCount        int
	UnderpaidCount      int
	ManualReviewCount   int
}

type AdminNetworkBreakdown struct {
	Network    Network
	PaidUSD    decimal.Decimal
	PaidCount  int
	TotalCount int
}

type AdminStatusBreakdown struct {
	Status InvoiceStatus
	Count  int
	USD    decimal.Decimal
}

type AdminPlanBreakdown struct {
	PlanCode  PlanCode
	PaidUSD   decimal.Decimal
	PaidCount int
}

type AdminInvoiceRecord struct {
	ID                 int64
	PublicID           string
	WorkspaceID        int64
	WorkspaceUsername  string
	WorkspaceEmail     string
	Kind               InvoiceKind
	PlanCode           PlanCode
	Title              string
	BaseAmountUSD      decimal.Decimal
	PayableAmount      decimal.Decimal
	PayableNetwork     Network
	DestinationAddress string
	PaymentComment     string
	Status             InvoiceStatus
	Classification     string
	TxHash             string
	ExpiresAt          time.Time
	PaidAt             *time.Time
	CreatedAt          time.Time
}

type AdminInvoiceFilters struct {
	Page     int
	PageSize int
	Status   string
	Kind     string
	Query    string
}

type AdminInvoicePage struct {
	Items    []AdminInvoiceRecord
	Total    int
	Page     int
	PageSize int
}

func (s *Store) GetAdminOverview(ctx context.Context) (AdminOverview, error) {
	overview := AdminOverview{GeneratedAt: time.Now().UTC()}

	if err := s.pool.QueryRow(ctx, `
		SELECT
			COUNT(1),
			COUNT(1) FILTER (WHERE status = 'paid'),
			COUNT(1) FILTER (WHERE status = 'awaiting_payment'),
			COUNT(1) FILTER (WHERE status = 'underpaid'),
			COUNT(1) FILTER (WHERE status = 'manual_review'),
			COUNT(1) FILTER (WHERE status = 'expired'),
			COUNT(1) FILTER (WHERE status = 'paid' AND kind = 'merchant'),
			COUNT(1) FILTER (WHERE status = 'paid' AND kind = 'subscription'),
			COALESCE(SUM(base_amount_usd) FILTER (WHERE status = 'paid'), 0),
			COALESCE(SUM(base_amount_usd) FILTER (WHERE status = 'paid' AND kind = 'merchant'), 0),
			COALESCE(SUM(base_amount_usd) FILTER (WHERE status = 'paid' AND kind = 'subscription'), 0),
			COALESCE(SUM(base_amount_usd) FILTER (WHERE status IN ('awaiting_payment', 'underpaid', 'manual_review')), 0)
		FROM invoices
	`).Scan(
		&overview.Totals.InvoicesTotal,
		&overview.Totals.PaidTotal,
		&overview.Totals.AwaitingTotal,
		&overview.Totals.UnderpaidTotal,
		&overview.Totals.ManualReviewTotal,
		&overview.Totals.ExpiredTotal,
		&overview.Totals.MerchantPaidTotal,
		&overview.Totals.SubscriptionPaidTotal,
		&overview.Totals.GrossPaidUSD,
		&overview.Totals.MerchantPaidUSD,
		&overview.Totals.SubscriptionPaidUSD,
		&overview.Totals.OpenInvoiceUSD,
	); err != nil {
		return AdminOverview{}, fmt.Errorf("admin overview invoice totals: %w", err)
	}

	if err := s.pool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(1) FROM workspaces),
			(SELECT COUNT(1) FROM workspaces WHERE subscription_ends_at IS NOT NULL AND subscription_ends_at > NOW()),
			(SELECT COUNT(1) FROM workspaces WHERE is_blocked = TRUE),
			(SELECT COUNT(1) FROM wallets WHERE is_active = TRUE),
			(SELECT COUNT(1) FROM api_keys WHERE revoked_at IS NULL),
			(SELECT COUNT(1) FROM webhook_endpoints WHERE is_active = TRUE)
	`).Scan(
		&overview.Totals.WorkspacesTotal,
		&overview.Totals.ActiveSubscribers,
		&overview.Totals.BlockedWorkspaces,
		&overview.Totals.WalletsTotal,
		&overview.Totals.APIKeysActive,
		&overview.Totals.WebhookEndpoints,
	); err != nil {
		return AdminOverview{}, fmt.Errorf("admin overview resource totals: %w", err)
	}

	dailyRows, err := s.pool.Query(ctx, `
		WITH days AS (
			SELECT generate_series(
				date_trunc('day', NOW()) - INTERVAL '29 days',
				date_trunc('day', NOW()),
				INTERVAL '1 day'
			) AS day
		)
		SELECT
			d.day,
			COALESCE(SUM(i.base_amount_usd) FILTER (WHERE i.status = 'paid' AND i.paid_at IS NOT NULL AND date_trunc('day', i.paid_at) = d.day), 0),
			COALESCE(SUM(i.base_amount_usd) FILTER (WHERE i.status = 'paid' AND i.kind = 'merchant' AND i.paid_at IS NOT NULL AND date_trunc('day', i.paid_at) = d.day), 0),
			COALESCE(SUM(i.base_amount_usd) FILTER (WHERE i.status = 'paid' AND i.kind = 'subscription' AND i.paid_at IS NOT NULL AND date_trunc('day', i.paid_at) = d.day), 0),
			COUNT(i.id) FILTER (WHERE i.status = 'paid' AND i.paid_at IS NOT NULL AND date_trunc('day', i.paid_at) = d.day),
			COUNT(i.id) FILTER (WHERE date_trunc('day', i.created_at) = d.day),
			COUNT(i.id) FILTER (WHERE i.status = 'underpaid' AND date_trunc('day', i.created_at) = d.day),
			COUNT(i.id) FILTER (WHERE i.status = 'manual_review' AND date_trunc('day', i.created_at) = d.day)
		FROM days d
		LEFT JOIN invoices i ON date_trunc('day', i.created_at) = d.day OR (i.paid_at IS NOT NULL AND date_trunc('day', i.paid_at) = d.day)
		GROUP BY d.day
		ORDER BY d.day ASC
	`)
	if err != nil {
		return AdminOverview{}, fmt.Errorf("admin overview daily sales: %w", err)
	}
	defer dailyRows.Close()
	for dailyRows.Next() {
		var point AdminDailySalesPoint
		if err := dailyRows.Scan(
			&point.Date,
			&point.PaidUSD,
			&point.MerchantPaidUSD,
			&point.SubscriptionPaidUSD,
			&point.PaidCount,
			&point.CreatedCount,
			&point.UnderpaidCount,
			&point.ManualReviewCount,
		); err != nil {
			return AdminOverview{}, fmt.Errorf("scan admin daily sales: %w", err)
		}
		overview.DailySales = append(overview.DailySales, point)
	}
	if err := dailyRows.Err(); err != nil {
		return AdminOverview{}, err
	}

	networkRows, err := s.pool.Query(ctx, `
		SELECT
			payable_network,
			COALESCE(SUM(base_amount_usd) FILTER (WHERE status = 'paid'), 0),
			COUNT(1) FILTER (WHERE status = 'paid'),
			COUNT(1)
		FROM invoices
		GROUP BY payable_network
		ORDER BY COALESCE(SUM(base_amount_usd) FILTER (WHERE status = 'paid'), 0) DESC, payable_network ASC
	`)
	if err != nil {
		return AdminOverview{}, fmt.Errorf("admin overview network breakdown: %w", err)
	}
	defer networkRows.Close()
	for networkRows.Next() {
		var item AdminNetworkBreakdown
		if err := networkRows.Scan(&item.Network, &item.PaidUSD, &item.PaidCount, &item.TotalCount); err != nil {
			return AdminOverview{}, fmt.Errorf("scan admin network breakdown: %w", err)
		}
		overview.NetworkBreakdown = append(overview.NetworkBreakdown, item)
	}
	if err := networkRows.Err(); err != nil {
		return AdminOverview{}, err
	}

	statusRows, err := s.pool.Query(ctx, `
		SELECT
			status,
			COUNT(1),
			COALESCE(SUM(base_amount_usd), 0)
		FROM invoices
		GROUP BY status
		ORDER BY COUNT(1) DESC, status ASC
	`)
	if err != nil {
		return AdminOverview{}, fmt.Errorf("admin overview status breakdown: %w", err)
	}
	defer statusRows.Close()
	for statusRows.Next() {
		var item AdminStatusBreakdown
		if err := statusRows.Scan(&item.Status, &item.Count, &item.USD); err != nil {
			return AdminOverview{}, fmt.Errorf("scan admin status breakdown: %w", err)
		}
		overview.StatusBreakdown = append(overview.StatusBreakdown, item)
	}
	if err := statusRows.Err(); err != nil {
		return AdminOverview{}, err
	}

	planRows, err := s.pool.Query(ctx, `
		SELECT
			CASE
				WHEN kind = 'subscription' AND (plan_code = '' OR plan_code = 'trial') THEN 'merchant'
				WHEN plan_code = '' THEN 'merchant'
				ELSE plan_code
			END AS plan_bucket,
			COALESCE(SUM(base_amount_usd) FILTER (WHERE status = 'paid'), 0),
			COUNT(1) FILTER (WHERE status = 'paid')
		FROM invoices
		GROUP BY plan_bucket
		ORDER BY COALESCE(SUM(base_amount_usd) FILTER (WHERE status = 'paid'), 0) DESC, plan_bucket ASC
	`)
	if err != nil {
		return AdminOverview{}, fmt.Errorf("admin overview plan breakdown: %w", err)
	}
	defer planRows.Close()
	for planRows.Next() {
		var rawCode string
		var item AdminPlanBreakdown
		if err := planRows.Scan(&rawCode, &item.PaidUSD, &item.PaidCount); err != nil {
			return AdminOverview{}, fmt.Errorf("scan admin plan breakdown: %w", err)
		}
		item.PlanCode = NormalizePlanCode(rawCode)
		if rawCode == "merchant" {
			item.PlanCode = PlanCode("merchant")
		}
		overview.PlanBreakdown = append(overview.PlanBreakdown, item)
	}
	if err := planRows.Err(); err != nil {
		return AdminOverview{}, err
	}

	recentSales, err := s.listAdminInvoices(ctx, AdminInvoiceFilters{Page: 1, PageSize: 12}, true)
	if err != nil {
		return AdminOverview{}, err
	}
	overview.RecentSales = recentSales.Items
	return overview, nil
}

func (s *Store) ListAdminInvoices(ctx context.Context, filters AdminInvoiceFilters) (AdminInvoicePage, error) {
	return s.listAdminInvoices(ctx, filters, false)
}

func (s *Store) listAdminInvoices(ctx context.Context, filters AdminInvoiceFilters, prioritizePaid bool) (AdminInvoicePage, error) {
	if filters.Page < 1 {
		filters.Page = 1
	}
	if filters.PageSize < 1 || filters.PageSize > 200 {
		filters.PageSize = 50
	}

	whereParts := []string{"TRUE"}
	args := make([]any, 0, 8)
	argIndex := 1

	if status := strings.TrimSpace(filters.Status); status != "" && status != "all" {
		whereParts = append(whereParts, fmt.Sprintf("i.status = $%d", argIndex))
		args = append(args, status)
		argIndex++
	}
	if kind := strings.TrimSpace(filters.Kind); kind != "" && kind != "all" {
		whereParts = append(whereParts, fmt.Sprintf("i.kind = $%d", argIndex))
		args = append(args, kind)
		argIndex++
	}
	if query := strings.TrimSpace(filters.Query); query != "" {
		whereParts = append(whereParts, fmt.Sprintf("(i.public_id ILIKE $%d OR i.title ILIKE $%d OR COALESCE(w.username, '') ILIKE $%d OR COALESCE(w.email, '') ILIKE $%d)", argIndex, argIndex, argIndex, argIndex))
		args = append(args, "%"+query+"%")
		argIndex++
	}

	whereClause := strings.Join(whereParts, " AND ")

	countQuery := `
		SELECT COUNT(1)
		FROM invoices i
		JOIN workspaces w ON w.id = i.workspace_id
		WHERE ` + whereClause
	var total int
	if err := s.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return AdminInvoicePage{}, fmt.Errorf("count admin invoices: %w", err)
	}

	orderClause := "COALESCE(i.paid_at, i.created_at) DESC, i.id DESC"
	if prioritizePaid {
		orderClause = "CASE WHEN i.status = 'paid' THEN 0 ELSE 1 END ASC, COALESCE(i.paid_at, i.created_at) DESC, i.id DESC"
	}

	listQuery := `
		SELECT
			i.id,
			i.public_id,
			i.workspace_id,
			COALESCE(w.username, ''),
			COALESCE(w.email, ''),
			i.kind,
			i.plan_code,
			i.title,
			i.base_amount_usd,
			i.payable_amount,
			i.payable_network,
			i.destination_address,
			COALESCE(i.payment_comment, ''),
			i.status,
			COALESCE(pe.classification, CASE WHEN i.status = 'paid' AND i.tx_hash IS NULL THEN 'manual_mark_paid' ELSE '' END),
			COALESCE(i.tx_hash, ''),
			i.expires_at,
			i.paid_at,
			i.created_at
		FROM invoices i
		JOIN workspaces w ON w.id = i.workspace_id
		LEFT JOIN LATERAL (
			SELECT classification
			FROM payment_events pe
			WHERE pe.matched_invoice_id = i.id
			   OR (i.tx_hash IS NOT NULL AND pe.tx_hash = i.tx_hash)
			ORDER BY pe.created_at DESC
			LIMIT 1
		) pe ON TRUE
		WHERE ` + whereClause + `
		ORDER BY ` + orderClause + `
		LIMIT $` + fmt.Sprintf("%d", argIndex) + ` OFFSET $` + fmt.Sprintf("%d", argIndex+1)
	args = append(args, filters.PageSize, (filters.Page-1)*filters.PageSize)

	rows, err := s.pool.Query(ctx, listQuery, args...)
	if err != nil {
		return AdminInvoicePage{}, fmt.Errorf("list admin invoices: %w", err)
	}
	defer rows.Close()

	items := make([]AdminInvoiceRecord, 0, filters.PageSize)
	for rows.Next() {
		var item AdminInvoiceRecord
		var paidAt sql.NullTime
		if err := rows.Scan(
			&item.ID,
			&item.PublicID,
			&item.WorkspaceID,
			&item.WorkspaceUsername,
			&item.WorkspaceEmail,
			&item.Kind,
			&item.PlanCode,
			&item.Title,
			&item.BaseAmountUSD,
			&item.PayableAmount,
			&item.PayableNetwork,
			&item.DestinationAddress,
			&item.PaymentComment,
			&item.Status,
			&item.Classification,
			&item.TxHash,
			&item.ExpiresAt,
			&paidAt,
			&item.CreatedAt,
		); err != nil {
			return AdminInvoicePage{}, fmt.Errorf("scan admin invoice: %w", err)
		}
		if paidAt.Valid {
			item.PaidAt = &paidAt.Time
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return AdminInvoicePage{}, err
	}

	return AdminInvoicePage{
		Items:    items,
		Total:    total,
		Page:     filters.Page,
		PageSize: filters.PageSize,
	}, nil
}
