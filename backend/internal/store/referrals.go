package store

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/shopspring/decimal"
)

// Commission tiers from the go-to-market strategy: every partner earns their
// base rate (default 25%) and is automatically bumped to 30% in any month
// where at least 10 of their referrals paid for a subscription. A higher
// launch rate (30-40% for early partners) can be set per partner with an
// expiry date; the best applicable rate wins.
const (
	referralTierActiveThreshold = 10
	referralTierPct             = 30
)

var ErrReferralPayoutExceedsBalance = errors.New("payout amount exceeds referral balance")

// referralAttributionWindow limits how long after workspace creation a ref
// code can still claim the signup. It protects long-existing merchants from
// being re-attributed when they log in with someone's ref cookie, while
// covering the real flow (visit ?ref link -> start bot -> log in days later).
const referralAttributionWindow = 7 * 24 * time.Hour

type ReferralPartner struct {
	ID                  int64            `json:"id"`
	Code                string           `json:"code"`
	Name                string           `json:"name"`
	Contact             string           `json:"contact"`
	CommissionPct       decimal.Decimal  `json:"commission_pct"`
	LaunchCommissionPct *decimal.Decimal `json:"launch_commission_pct,omitempty"`
	LaunchEndsAt        *time.Time       `json:"launch_ends_at,omitempty"`
	PayoutAddress       string           `json:"payout_address"`
	Notes               string           `json:"notes"`
	IsArchived          bool             `json:"is_archived"`
	CreatedAt           time.Time        `json:"created_at"`
}

type ReferralPartnerInput struct {
	Code                string
	Name                string
	Contact             string
	CommissionPct       decimal.Decimal
	LaunchCommissionPct *decimal.Decimal
	LaunchEndsAt        *time.Time
	PayoutAddress       string
	Notes               string
	IsArchived          bool
}

type ReferralPartnerStats struct {
	ReferralPartner
	Clicks          int64           `json:"clicks"`
	Signups         int64           `json:"signups"`
	ActiveReferrals int64           `json:"active_referrals"`
	RevenueUSD      decimal.Decimal `json:"revenue_usd"`
	AccruedUSD      decimal.Decimal `json:"accrued_usd"`
	PaidUSD         decimal.Decimal `json:"paid_usd"`
	OwedUSD         decimal.Decimal `json:"owed_usd"`
}

type ReferralMonthlyStat struct {
	Month           time.Time       `json:"month"`
	RevenueUSD      decimal.Decimal `json:"revenue_usd"`
	ActiveReferrals int64           `json:"active_referrals"`
	RatePct         decimal.Decimal `json:"rate_pct"`
	AccruedUSD      decimal.Decimal `json:"accrued_usd"`
}

type ReferralPayout struct {
	ID        int64           `json:"id"`
	PartnerID int64           `json:"partner_id"`
	AmountUSD decimal.Decimal `json:"amount_usd"`
	Note      string          `json:"note"`
	CreatedBy string          `json:"created_by"`
	PaidAt    time.Time       `json:"paid_at"`
}

type ReferralWorkspaceRow struct {
	WorkspaceID int64           `json:"workspace_id"`
	Username    string          `json:"username"`
	SignedUpAt  time.Time       `json:"signed_up_at"`
	RevenueUSD  decimal.Decimal `json:"revenue_usd"`
}

type ReferralPartnerReport struct {
	Partner   ReferralPartner        `json:"partner"`
	Months    []ReferralMonthlyStat  `json:"months"`
	Payouts   []ReferralPayout       `json:"payouts"`
	Referrals []ReferralWorkspaceRow `json:"referrals"`
}

const referralPartnerColumns = `id, code, name, contact, commission_pct, launch_commission_pct, launch_ends_at, payout_address, notes, is_archived, created_at`

func scanReferralPartner(row interface{ Scan(...any) error }) (ReferralPartner, error) {
	var partner ReferralPartner
	err := row.Scan(&partner.ID, &partner.Code, &partner.Name, &partner.Contact, &partner.CommissionPct, &partner.LaunchCommissionPct, &partner.LaunchEndsAt, &partner.PayoutAddress, &partner.Notes, &partner.IsArchived, &partner.CreatedAt)
	return partner, err
}

func (s *Store) CreateReferralPartner(ctx context.Context, input ReferralPartnerInput) (ReferralPartner, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO referral_partners (code, name, contact, commission_pct, launch_commission_pct, launch_ends_at, payout_address, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING `+referralPartnerColumns+`
	`, input.Code, limitString(input.Name, 160), limitString(input.Contact, 240), input.CommissionPct, input.LaunchCommissionPct, input.LaunchEndsAt, limitString(input.PayoutAddress, 240), limitString(input.Notes, 2000))
	partner, err := scanReferralPartner(row)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return ReferralPartner{}, errors.New("referral code is already taken")
		}
		return ReferralPartner{}, fmt.Errorf("create referral partner: %w", err)
	}
	return partner, nil
}

// UpdateReferralPartner replaces every editable field; the code is immutable
// because it is baked into links partners already shared.
func (s *Store) UpdateReferralPartner(ctx context.Context, id int64, input ReferralPartnerInput) (ReferralPartner, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE referral_partners
		SET name = $2, contact = $3, commission_pct = $4, launch_commission_pct = $5, launch_ends_at = $6, payout_address = $7, notes = $8, is_archived = $9
		WHERE id = $1
		RETURNING `+referralPartnerColumns+`
	`, id, limitString(input.Name, 160), limitString(input.Contact, 240), input.CommissionPct, input.LaunchCommissionPct, input.LaunchEndsAt, limitString(input.PayoutAddress, 240), limitString(input.Notes, 2000), input.IsArchived)
	partner, err := scanReferralPartner(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ReferralPartner{}, ErrNotFound
		}
		return ReferralPartner{}, fmt.Errorf("update referral partner: %w", err)
	}
	return partner, nil
}

// GetReferralPartnerByCode resolves an active partner for public code
// validation on the signup form.
func (s *Store) GetReferralPartnerByCode(ctx context.Context, code string) (ReferralPartner, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+referralPartnerColumns+`
		FROM referral_partners
		WHERE code = $1 AND NOT is_archived
	`, strings.ToLower(strings.TrimSpace(code)))
	partner, err := scanReferralPartner(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ReferralPartner{}, ErrNotFound
		}
		return ReferralPartner{}, fmt.Errorf("get referral partner by code: %w", err)
	}
	return partner, nil
}

// AttachReferralSignup links a freshly created workspace to the partner whose
// code the merchant arrived with. Unknown or archived codes and workspaces
// older than the attribution window are silently ignored; the first recorded
// partner wins for the lifetime of the workspace.
func (s *Store) AttachReferralSignup(ctx context.Context, workspaceID int64, code string) error {
	code = strings.ToLower(strings.TrimSpace(code))
	if workspaceID <= 0 || code == "" {
		return nil
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO referral_signups (workspace_id, partner_id)
		SELECT w.id, p.id
		FROM workspaces w
		JOIN referral_partners p ON p.code = $2 AND NOT p.is_archived
		WHERE w.id = $1 AND w.created_at > NOW() - make_interval(secs => $3)
		ON CONFLICT (workspace_id) DO NOTHING
	`, workspaceID, code, referralAttributionWindow.Seconds())
	if err != nil {
		return fmt.Errorf("attach referral signup: %w", err)
	}
	return nil
}

// referralMonthlyCTE computes per partner-month subscription revenue from
// referred workspaces, the number of distinct paying referrals and accrued
// commission. Launch commission is applied per invoice so a launch window
// ending mid-month does not overpay invoices received after the cutoff.
const referralMonthlyCTE = `
	monthly AS (
		SELECT rs.partner_id,
		       date_trunc('month', i.paid_at) AS month,
		       SUM(i.base_amount_usd) AS revenue_usd,
		       COUNT(DISTINCT i.workspace_id) AS active_referrals,
		       SUM(
		           CASE
		               WHEN p.launch_ends_at IS NOT NULL
		                    AND p.launch_commission_pct IS NOT NULL
		                    AND i.paid_at < p.launch_ends_at
		               THEN i.base_amount_usd
		               ELSE 0
		           END
		       ) AS launch_revenue_usd
		FROM referral_signups rs
		JOIN invoices i ON i.workspace_id = rs.workspace_id
		JOIN referral_partners p ON p.id = rs.partner_id
		WHERE i.kind = 'subscription' AND i.status IN ('paid', 'overpaid') AND i.paid_at IS NOT NULL
		GROUP BY rs.partner_id, date_trunc('month', i.paid_at)
	), monthly_rates AS (
		SELECT m.*,
		       GREATEST(p.commission_pct, CASE WHEN m.active_referrals >= $1 THEN $2::numeric ELSE 0 END) AS standard_rate_pct,
		       GREATEST(
		           p.commission_pct,
		           CASE WHEN m.active_referrals >= $1 THEN $2::numeric ELSE 0 END,
		           COALESCE(p.launch_commission_pct, 0)
		       ) AS launch_rate_pct
		FROM monthly m
		JOIN referral_partners p ON p.id = m.partner_id
	), monthly_rated AS (
		SELECT partner_id, month, revenue_usd, active_referrals,
		       (
		           (revenue_usd - launch_revenue_usd) * standard_rate_pct
		           + launch_revenue_usd * launch_rate_pct
		       ) / 100 AS accrued_usd,
		       CASE
		           WHEN revenue_usd > 0 THEN (
		               (revenue_usd - launch_revenue_usd) * standard_rate_pct
		               + launch_revenue_usd * launch_rate_pct
		           ) / revenue_usd
		           ELSE standard_rate_pct
		       END AS rate_pct
		FROM monthly_rates
	)`

// ListReferralPartners returns every partner with lifetime funnel and ledger
// stats: link clicks, signups, referrals paying this month, referred
// subscription revenue, accrued commission, recorded payouts and the balance
// still owed.
func (s *Store) ListReferralPartners(ctx context.Context) ([]ReferralPartnerStats, error) {
	rows, err := s.pool.Query(ctx, `
		WITH `+referralMonthlyCTE+`, accrual AS (
			SELECT partner_id,
			       SUM(revenue_usd) AS revenue_usd,
			       SUM(accrued_usd) AS accrued_usd
			FROM monthly_rated
			GROUP BY partner_id
		), clicks AS (
			SELECT p.id AS partner_id, COUNT(v.id) AS clicks
			FROM referral_partners p
			JOIN utm_visits v ON v.source = 'ref' AND v.campaign = p.code
			GROUP BY p.id
		), signup_counts AS (
			SELECT partner_id, COUNT(*) AS signups
			FROM referral_signups
			GROUP BY partner_id
		), current_active AS (
			SELECT partner_id, active_referrals
			FROM monthly_rated
			WHERE month = date_trunc('month', NOW())
		), payout_totals AS (
			SELECT partner_id, SUM(amount_usd) AS paid_usd
			FROM referral_payouts
			GROUP BY partner_id
		)
		SELECT p.id, p.code, p.name, p.contact, p.commission_pct, p.launch_commission_pct, p.launch_ends_at, p.payout_address, p.notes, p.is_archived, p.created_at,
		       COALESCE(c.clicks, 0),
		       COALESCE(sc.signups, 0),
		       COALESCE(ca.active_referrals, 0),
		       COALESCE(a.revenue_usd, 0),
		       COALESCE(a.accrued_usd, 0),
		       COALESCE(pt.paid_usd, 0),
		       COALESCE(a.accrued_usd, 0) - COALESCE(pt.paid_usd, 0)
		FROM referral_partners p
		LEFT JOIN accrual a ON a.partner_id = p.id
		LEFT JOIN clicks c ON c.partner_id = p.id
		LEFT JOIN signup_counts sc ON sc.partner_id = p.id
		LEFT JOIN current_active ca ON ca.partner_id = p.id
		LEFT JOIN payout_totals pt ON pt.partner_id = p.id
		ORDER BY p.is_archived ASC, COALESCE(a.accrued_usd, 0) DESC, p.created_at DESC
	`, referralTierActiveThreshold, referralTierPct)
	if err != nil {
		return nil, fmt.Errorf("list referral partners: %w", err)
	}
	defer rows.Close()

	items := []ReferralPartnerStats{}
	for rows.Next() {
		var item ReferralPartnerStats
		if err := rows.Scan(&item.ID, &item.Code, &item.Name, &item.Contact, &item.CommissionPct, &item.LaunchCommissionPct, &item.LaunchEndsAt, &item.PayoutAddress, &item.Notes, &item.IsArchived, &item.CreatedAt,
			&item.Clicks, &item.Signups, &item.ActiveReferrals, &item.RevenueUSD, &item.AccruedUSD, &item.PaidUSD, &item.OwedUSD); err != nil {
			return nil, fmt.Errorf("scan referral partner stats: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate referral partner stats: %w", err)
	}
	return items, nil
}

// GetReferralPartnerReport returns the monthly accrual breakdown, payout
// history and referred workspaces for one partner — everything needed to
// verify a monthly USDT payout by hand.
func (s *Store) GetReferralPartnerReport(ctx context.Context, partnerID int64) (ReferralPartnerReport, error) {
	row := s.pool.QueryRow(ctx, `SELECT `+referralPartnerColumns+` FROM referral_partners WHERE id = $1`, partnerID)
	partner, err := scanReferralPartner(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ReferralPartnerReport{}, ErrNotFound
		}
		return ReferralPartnerReport{}, fmt.Errorf("get referral partner: %w", err)
	}
	report := ReferralPartnerReport{Partner: partner, Months: []ReferralMonthlyStat{}, Payouts: []ReferralPayout{}, Referrals: []ReferralWorkspaceRow{}}

	monthRows, err := s.pool.Query(ctx, `
		WITH `+referralMonthlyCTE+`
		SELECT month, revenue_usd, active_referrals, rate_pct, accrued_usd
		FROM monthly_rated
		WHERE partner_id = $3
		ORDER BY month DESC
	`, referralTierActiveThreshold, referralTierPct, partnerID)
	if err != nil {
		return ReferralPartnerReport{}, fmt.Errorf("referral monthly stats: %w", err)
	}
	defer monthRows.Close()
	for monthRows.Next() {
		var item ReferralMonthlyStat
		if err := monthRows.Scan(&item.Month, &item.RevenueUSD, &item.ActiveReferrals, &item.RatePct, &item.AccruedUSD); err != nil {
			return ReferralPartnerReport{}, fmt.Errorf("scan referral monthly stat: %w", err)
		}
		report.Months = append(report.Months, item)
	}
	if err := monthRows.Err(); err != nil {
		return ReferralPartnerReport{}, fmt.Errorf("iterate referral monthly stats: %w", err)
	}

	payoutRows, err := s.pool.Query(ctx, `
		SELECT id, partner_id, amount_usd, note, created_by, paid_at
		FROM referral_payouts
		WHERE partner_id = $1
		ORDER BY paid_at DESC
	`, partnerID)
	if err != nil {
		return ReferralPartnerReport{}, fmt.Errorf("referral payouts: %w", err)
	}
	defer payoutRows.Close()
	for payoutRows.Next() {
		var item ReferralPayout
		if err := payoutRows.Scan(&item.ID, &item.PartnerID, &item.AmountUSD, &item.Note, &item.CreatedBy, &item.PaidAt); err != nil {
			return ReferralPartnerReport{}, fmt.Errorf("scan referral payout: %w", err)
		}
		report.Payouts = append(report.Payouts, item)
	}
	if err := payoutRows.Err(); err != nil {
		return ReferralPartnerReport{}, fmt.Errorf("iterate referral payouts: %w", err)
	}

	referralRows, err := s.pool.Query(ctx, `
		SELECT rs.workspace_id, COALESCE(w.username, ''), rs.created_at,
		       COALESCE((
		           SELECT SUM(i.base_amount_usd)
		           FROM invoices i
		           WHERE i.workspace_id = rs.workspace_id AND i.kind = 'subscription' AND i.status IN ('paid', 'overpaid')
		       ), 0)
		FROM referral_signups rs
		JOIN workspaces w ON w.id = rs.workspace_id
		WHERE rs.partner_id = $1
		ORDER BY rs.created_at DESC
		LIMIT 200
	`, partnerID)
	if err != nil {
		return ReferralPartnerReport{}, fmt.Errorf("referral workspaces: %w", err)
	}
	defer referralRows.Close()
	for referralRows.Next() {
		var item ReferralWorkspaceRow
		if err := referralRows.Scan(&item.WorkspaceID, &item.Username, &item.SignedUpAt, &item.RevenueUSD); err != nil {
			return ReferralPartnerReport{}, fmt.Errorf("scan referral workspace: %w", err)
		}
		report.Referrals = append(report.Referrals, item)
	}
	if err := referralRows.Err(); err != nil {
		return ReferralPartnerReport{}, fmt.Errorf("iterate referral workspaces: %w", err)
	}
	return report, nil
}

// CreateReferralPayout records that a payout was sent manually (USDT). It
// only writes the ledger entry; moving the money stays a human action.
func (s *Store) CreateReferralPayout(ctx context.Context, partnerID int64, amountUSD decimal.Decimal, note string, createdBy string) (ReferralPayout, error) {
	if amountUSD.LessThanOrEqual(decimal.Zero) {
		return ReferralPayout{}, errors.New("payout amount must be positive")
	}
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return ReferralPayout{}, fmt.Errorf("begin referral payout: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var lockedPartnerID int64
	if err := tx.QueryRow(ctx, `SELECT id FROM referral_partners WHERE id = $1 FOR UPDATE`, partnerID).Scan(&lockedPartnerID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ReferralPayout{}, ErrNotFound
		}
		return ReferralPayout{}, fmt.Errorf("lock referral partner: %w", err)
	}

	var owed decimal.Decimal
	err = tx.QueryRow(ctx, `
		WITH `+referralMonthlyCTE+`, payout_total AS (
			SELECT COALESCE(SUM(amount_usd), 0) AS paid_usd
			FROM referral_payouts
			WHERE partner_id = $3
		)
		SELECT COALESCE(SUM(accrued_usd), 0) - (SELECT paid_usd FROM payout_total)
		FROM monthly_rated
		WHERE partner_id = $3
	`, referralTierActiveThreshold, referralTierPct, partnerID).Scan(&owed)
	if err != nil {
		return ReferralPayout{}, fmt.Errorf("calculate referral payout balance: %w", err)
	}
	if amountUSD.GreaterThan(owed) {
		return ReferralPayout{}, ErrReferralPayoutExceedsBalance
	}

	var payout ReferralPayout
	err = tx.QueryRow(ctx, `
		INSERT INTO referral_payouts (partner_id, amount_usd, note, created_by)
		VALUES ($1, $2, $3, $4)
		RETURNING id, partner_id, amount_usd, note, created_by, paid_at
	`, partnerID, amountUSD, limitString(note, 500), limitString(createdBy, 160)).Scan(&payout.ID, &payout.PartnerID, &payout.AmountUSD, &payout.Note, &payout.CreatedBy, &payout.PaidAt)
	if err != nil {
		return ReferralPayout{}, fmt.Errorf("create referral payout: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return ReferralPayout{}, fmt.Errorf("commit referral payout: %w", err)
	}
	return payout, nil
}
