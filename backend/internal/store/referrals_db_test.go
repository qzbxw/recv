package store

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/shopspring/decimal"
)

// insertPaidSubscriptionInvoice creates a paid subscription invoice directly
// so referral accrual tests can control the amount and payment month.
func insertPaidSubscriptionInvoice(t *testing.T, ctx context.Context, st *Store, workspaceID int64, amountUSD int64, paidAt time.Time) {
	t.Helper()
	_, err := st.pool.Exec(ctx, `
		INSERT INTO invoices (public_id, workspace_id, kind, title, base_amount_usd, payable_amount, payable_network, destination_address, status, expires_at, paid_at, created_at)
		VALUES (LEFT(MD5(random()::text), 16), $1, 'subscription', 'plan', $2, $2, 'TON', 'dest', 'paid', $3::timestamptz + INTERVAL '1 hour', $3, $3)
	`, workspaceID, amountUSD, paidAt)
	if err != nil {
		t.Fatalf("insert paid subscription invoice: %v", err)
	}
}

func referralTestPartner(t *testing.T, ctx context.Context, st *Store, input ReferralPartnerInput) ReferralPartner {
	t.Helper()
	partner, err := st.CreateReferralPartner(ctx, input)
	if err != nil {
		t.Fatalf("CreateReferralPartner: %v", err)
	}
	return partner
}

func findPartnerStats(t *testing.T, items []ReferralPartnerStats, id int64) ReferralPartnerStats {
	t.Helper()
	for _, item := range items {
		if item.ID == id {
			return item
		}
	}
	t.Fatalf("partner %d not found in stats", id)
	return ReferralPartnerStats{}
}

// TestReferralAccrualAndPayouts walks the full ledger: signup attribution,
// commission accrual at the base rate, the automatic tier bump at 10 active
// referrals, the launch-rate override and payout bookkeeping.
func TestReferralAccrualAndPayouts(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)
	now := time.Now().UTC()

	base := referralTestPartner(t, ctx, st, ReferralPartnerInput{Code: "ref-base", Name: "Base Partner", CommissionPct: decimal.NewFromInt(25)})

	launchPct := decimal.NewFromInt(40)
	launchEnds := time.Date(now.Year(), now.Month(), 15, 12, 0, 0, 0, time.UTC)
	launch := referralTestPartner(t, ctx, st, ReferralPartnerInput{Code: "ref-launch", Name: "Launch Partner", CommissionPct: decimal.NewFromInt(25), LaunchCommissionPct: &launchPct, LaunchEndsAt: &launchEnds})

	tier := referralTestPartner(t, ctx, st, ReferralPartnerInput{Code: "ref-tier", Name: "Tier Partner", CommissionPct: decimal.NewFromInt(25)})

	// Base partner: one referral paying $100 this month -> 25% = $25.
	baseWorkspace, err := st.UpsertWorkspaceByTelegram(ctx, 81001, "refbaseuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	if err := st.AttachReferralSignup(ctx, baseWorkspace.ID, "REF-BASE "); err != nil {
		t.Fatalf("AttachReferralSignup: %v", err)
	}
	insertPaidSubscriptionInvoice(t, ctx, st, baseWorkspace.ID, 100, now)

	// A second ref code must not steal the workspace.
	if err := st.AttachReferralSignup(ctx, baseWorkspace.ID, "ref-launch"); err != nil {
		t.Fatalf("AttachReferralSignup second code: %v", err)
	}
	// Unknown codes are silently ignored.
	if err := st.AttachReferralSignup(ctx, baseWorkspace.ID, "no-such-code"); err != nil {
		t.Fatalf("AttachReferralSignup unknown code: %v", err)
	}

	// Launch partner: $100 before and $100 after a mid-month launch cutoff
	// -> $40 + $25 = $65.
	launchWorkspace, err := st.UpsertWorkspaceByTelegram(ctx, 81002, "reflaunchuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	if err := st.AttachReferralSignup(ctx, launchWorkspace.ID, "ref-launch"); err != nil {
		t.Fatalf("AttachReferralSignup launch: %v", err)
	}
	insertPaidSubscriptionInvoice(t, ctx, st, launchWorkspace.ID, 100, launchEnds.Add(-24*time.Hour))
	insertPaidSubscriptionInvoice(t, ctx, st, launchWorkspace.ID, 100, launchEnds.Add(24*time.Hour))

	// Tier partner: 10 referrals paying $10 each -> bump to 30% of $100 = $30.
	for i := 0; i < referralTierActiveThreshold; i++ {
		workspace, err := st.UpsertWorkspaceByTelegram(ctx, int64(81100+i), fmt.Sprintf("reftieruser%02d", i))
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram tier %d: %v", i, err)
		}
		if err := st.AttachReferralSignup(ctx, workspace.ID, "ref-tier"); err != nil {
			t.Fatalf("AttachReferralSignup tier %d: %v", i, err)
		}
		insertPaidSubscriptionInvoice(t, ctx, st, workspace.ID, 10, now)
	}

	items, err := st.ListReferralPartners(ctx)
	if err != nil {
		t.Fatalf("ListReferralPartners: %v", err)
	}

	baseStats := findPartnerStats(t, items, base.ID)
	if baseStats.Signups != 1 || !baseStats.RevenueUSD.Equal(decimal.NewFromInt(100)) {
		t.Fatalf("unexpected base stats: %+v", baseStats)
	}
	if !baseStats.AccruedUSD.Equal(decimal.NewFromInt(25)) {
		t.Fatalf("expected base accrual 25, got %s", baseStats.AccruedUSD)
	}

	launchStats := findPartnerStats(t, items, launch.ID)
	if !launchStats.AccruedUSD.Equal(decimal.NewFromInt(65)) {
		t.Fatalf("expected launch accrual 65, got %s", launchStats.AccruedUSD)
	}

	tierStats := findPartnerStats(t, items, tier.ID)
	if tierStats.ActiveReferrals != int64(referralTierActiveThreshold) {
		t.Fatalf("expected %d active referrals, got %d", referralTierActiveThreshold, tierStats.ActiveReferrals)
	}
	if !tierStats.AccruedUSD.Equal(decimal.NewFromInt(30)) {
		t.Fatalf("expected tier accrual 30, got %s", tierStats.AccruedUSD)
	}

	// Payouts reduce the open balance but never touch accruals.
	payout, err := st.CreateReferralPayout(ctx, base.ID, decimal.NewFromInt(20), "june usdt transfer", "admin")
	if err != nil {
		t.Fatalf("CreateReferralPayout: %v", err)
	}
	if !payout.AmountUSD.Equal(decimal.NewFromInt(20)) {
		t.Fatalf("unexpected payout: %+v", payout)
	}
	if _, err := st.CreateReferralPayout(ctx, base.ID, decimal.Zero, "", "admin"); err == nil {
		t.Fatal("expected zero payout to fail")
	}
	if _, err := st.CreateReferralPayout(ctx, base.ID, decimal.NewFromInt(6), "", "admin"); err != ErrReferralPayoutExceedsBalance {
		t.Fatalf("expected overpayment guard, got %v", err)
	}
	if _, err := st.CreateReferralPayout(ctx, 999999, decimal.NewFromInt(5), "", "admin"); err != ErrNotFound {
		t.Fatalf("expected ErrNotFound for unknown partner, got %v", err)
	}

	items, err = st.ListReferralPartners(ctx)
	if err != nil {
		t.Fatalf("ListReferralPartners after payout: %v", err)
	}
	baseStats = findPartnerStats(t, items, base.ID)
	if !baseStats.PaidUSD.Equal(decimal.NewFromInt(20)) || !baseStats.OwedUSD.Equal(decimal.NewFromInt(5)) {
		t.Fatalf("expected paid 20 / owed 5, got paid %s owed %s", baseStats.PaidUSD, baseStats.OwedUSD)
	}

	report, err := st.GetReferralPartnerReport(ctx, base.ID)
	if err != nil {
		t.Fatalf("GetReferralPartnerReport: %v", err)
	}
	if len(report.Months) != 1 || !report.Months[0].AccruedUSD.Equal(decimal.NewFromInt(25)) || !report.Months[0].RatePct.Equal(decimal.NewFromInt(25)) {
		t.Fatalf("unexpected monthly breakdown: %+v", report.Months)
	}
	if len(report.Payouts) != 1 || report.Payouts[0].Note != "june usdt transfer" {
		t.Fatalf("unexpected payouts: %+v", report.Payouts)
	}
	if len(report.Referrals) != 1 || report.Referrals[0].WorkspaceID != baseWorkspace.ID || !report.Referrals[0].RevenueUSD.Equal(decimal.NewFromInt(100)) {
		t.Fatalf("unexpected referrals: %+v", report.Referrals)
	}
}

// TestReferralAttachGuards verifies that archived partners and stale
// workspaces never get attributed.
func TestReferralAttachGuards(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	partner := referralTestPartner(t, ctx, st, ReferralPartnerInput{Code: "ref-guard", Name: "Guard Partner", CommissionPct: decimal.NewFromInt(25)})

	// Archived partner: no attribution.
	archivedInput := ReferralPartnerInput{Code: partner.Code, Name: partner.Name, CommissionPct: partner.CommissionPct, IsArchived: true}
	if _, err := st.UpdateReferralPartner(ctx, partner.ID, archivedInput); err != nil {
		t.Fatalf("UpdateReferralPartner archive: %v", err)
	}
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 81200, "refguarduser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	if err := st.AttachReferralSignup(ctx, workspace.ID, "ref-guard"); err != nil {
		t.Fatalf("AttachReferralSignup archived: %v", err)
	}

	// Restore the partner; a workspace older than the attribution window must
	// still be skipped.
	archivedInput.IsArchived = false
	if _, err := st.UpdateReferralPartner(ctx, partner.ID, archivedInput); err != nil {
		t.Fatalf("UpdateReferralPartner restore: %v", err)
	}
	if _, err := st.pool.Exec(ctx, `UPDATE workspaces SET created_at = NOW() - INTERVAL '30 days' WHERE id = $1`, workspace.ID); err != nil {
		t.Fatalf("age workspace: %v", err)
	}
	if err := st.AttachReferralSignup(ctx, workspace.ID, "ref-guard"); err != nil {
		t.Fatalf("AttachReferralSignup stale workspace: %v", err)
	}

	items, err := st.ListReferralPartners(ctx)
	if err != nil {
		t.Fatalf("ListReferralPartners: %v", err)
	}
	stats := findPartnerStats(t, items, partner.ID)
	if stats.Signups != 0 {
		t.Fatalf("expected no signups for guarded partner, got %d", stats.Signups)
	}

	// GetReferralPartnerByCode only resolves active partners.
	if _, err := st.GetReferralPartnerByCode(ctx, "REF-GUARD"); err != nil {
		t.Fatalf("GetReferralPartnerByCode active: %v", err)
	}
	archivedInput.IsArchived = true
	if _, err := st.UpdateReferralPartner(ctx, partner.ID, archivedInput); err != nil {
		t.Fatalf("UpdateReferralPartner re-archive: %v", err)
	}
	if _, err := st.GetReferralPartnerByCode(ctx, "ref-guard"); err != ErrNotFound {
		t.Fatalf("expected ErrNotFound for archived code, got %v", err)
	}

	// Duplicate codes are rejected with a friendly error.
	if _, err := st.CreateReferralPartner(ctx, ReferralPartnerInput{Code: "ref-guard", Name: "Dup", CommissionPct: decimal.NewFromInt(25)}); err == nil {
		t.Fatal("expected duplicate code to fail")
	}
}
