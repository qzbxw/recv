package service

import (
	"context"
	"strings"
	"testing"

	"recv/backend/internal/store"

	"github.com/shopspring/decimal"
)

// TestInvoiceServiceCreateInvoiceDBFlows tests createInvoiceWithDestination and all
// functions called by it: generateUniquePublicID, generateUniqueSuffix, calculateTONAmount.
func TestInvoiceServiceCreateInvoiceDBFlows(t *testing.T) {
	ctx := context.Background()
	st := newPaymentServiceTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 88100, "invdbuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	evmWallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0x1111111111111111111111111111111111111111")
	if err != nil {
		t.Fatalf("CreateWallet EVM: %v", err)
	}

	tonWallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkTON, "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHaWqcn")
	if err != nil {
		t.Fatalf("CreateWallet TON: %v", err)
	}

	// Use fixed TON rate so no external HTTP call is needed
	svc := NewInvoiceService(st, "5.0")

	t.Run("CreateInvoice on BASE exercises generateUniqueSuffix", func(t *testing.T) {
		inv, err := svc.CreateInvoice(ctx, workspace, CreateInvoiceInput{
			Title:          "BASE Test",
			BaseAmountUSD:  decimal.RequireFromString("10"),
			PayableNetwork: store.NetworkBASE,
			WalletID:       evmWallet.ID,
		})
		if err != nil {
			t.Fatalf("CreateInvoice BASE: %v", err)
		}
		if inv.PublicID == "" {
			t.Fatal("expected PublicID to be set")
		}
		if inv.PayableAmount.IsZero() {
			t.Fatal("expected PayableAmount to be set")
		}
	})

	t.Run("CreateInvoice on TON exercises calculateTONAmount", func(t *testing.T) {
		inv, err := svc.CreateInvoice(ctx, workspace, CreateInvoiceInput{
			Title:          "TON Test",
			BaseAmountUSD:  decimal.RequireFromString("5"),
			PayableNetwork: store.NetworkTON,
			WalletID:       tonWallet.ID,
		})
		if err != nil {
			t.Fatalf("CreateInvoice TON: %v", err)
		}
		if inv.PaymentComment == nil || !strings.HasPrefix(*inv.PaymentComment, "RECV-") {
			t.Fatalf("expected RECV- payment comment for TON, got %v", inv.PaymentComment)
		}
	})

	t.Run("createInvoiceWithDestination creates invoice without stored wallet", func(t *testing.T) {
		inv, err := svc.createInvoiceWithDestination(ctx, store.CreateInvoiceParams{
			WorkspaceID:        workspace.ID,
			Title:              "Direct Destination",
			BaseAmountUSD:      decimal.RequireFromString("15"),
			PayableNetwork:     store.NetworkTRON,
			DestinationAddress: "TYNY19wFMM24dJN4ciyuGZDNzzQHVcaMPd",
			Mode:               "live",
		}, 45)
		if err != nil {
			t.Fatalf("createInvoiceWithDestination: %v", err)
		}
		if inv.PublicID == "" || inv.DestinationAddress == "" || inv.MatchingSuffix == nil {
			t.Fatalf("expected direct destination invoice with suffix, got %+v", inv)
		}
		if inv.PayableNetwork != store.NetworkTRON || inv.PayableAsset != store.AssetUSDT {
			t.Fatalf("unexpected payment option defaults: %s/%s", inv.PayableNetwork, inv.PayableAsset)
		}
	})

	t.Run("generateUniqueSuffix uses default asset for network", func(t *testing.T) {
		suffix, err := svc.generateUniqueSuffix(ctx, "TYNY19wFMM24dJN4ciyuGZDNzzQHVcaMPd", store.NetworkTRON)
		if err != nil {
			t.Fatalf("generateUniqueSuffix: %v", err)
		}
		if !suffix.IsPositive() || suffix.GreaterThan(decimal.RequireFromString("0.010000")) {
			t.Fatalf("unexpected suffix: %s", suffix)
		}
	})

	t.Run("CreateInvoice on BASE exercises generateUniqueSuffix", func(t *testing.T) {
		// BASE uses EVM wallet bucket, so we need an EVM wallet
		baseWallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0x2222222222222222222222222222222222222222")
		if err != nil {
			t.Fatalf("CreateWallet EVM for BASE: %v", err)
		}
		inv, err := svc.CreateInvoice(ctx, workspace, CreateInvoiceInput{
			Title:          "BASE Test",
			BaseAmountUSD:  decimal.RequireFromString("20"),
			PayableNetwork: store.NetworkBASE,
			WalletID:       baseWallet.ID,
		})
		if err != nil {
			t.Fatalf("CreateInvoice BASE: %v", err)
		}
		if inv.MatchingSuffix == nil {
			t.Fatal("expected MatchingSuffix to be set for BASE invoice")
		}
	})

	t.Run("CreateInvoice rejects blocked workspace", func(t *testing.T) {
		blockedWs, err := st.UpsertWorkspaceByTelegram(ctx, 88101, "blockedinvuser")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
		}
		if _, err := st.SetWorkspaceBlocked(ctx, blockedWs.ID, true); err != nil {
			t.Fatalf("SetWorkspaceBlocked: %v", err)
		}
		blockedWs.IsBlocked = true

		_, err = svc.CreateInvoice(ctx, blockedWs, CreateInvoiceInput{
			Title:          "Blocked",
			BaseAmountUSD:  decimal.RequireFromString("10"),
			PayableNetwork: store.NetworkBASE,
		})
		if err == nil || !strings.Contains(err.Error(), "blocked") {
			t.Fatalf("expected blocked error, got %v", err)
		}
	})

	t.Run("CreateInvoice rejects missing title", func(t *testing.T) {
		_, err = svc.CreateInvoice(ctx, workspace, CreateInvoiceInput{
			BaseAmountUSD:  decimal.RequireFromString("10"),
			PayableNetwork: store.NetworkBASE,
		})
		if err == nil || !strings.Contains(err.Error(), "required") {
			t.Fatalf("expected title required error, got %v", err)
		}
	})

	t.Run("CreateInvoice rejects negative amount", func(t *testing.T) {
		_, err = svc.CreateInvoice(ctx, workspace, CreateInvoiceInput{
			Title:          "Neg",
			BaseAmountUSD:  decimal.RequireFromString("-1"),
			PayableNetwork: store.NetworkBASE,
		})
		if err == nil || !strings.Contains(err.Error(), "positive") {
			t.Fatalf("expected positive amount error, got %v", err)
		}
	})

	t.Run("CreateInvoice trial limit reached", func(t *testing.T) {
		trialWs, err := st.UpsertWorkspaceByTelegram(ctx, 88102, "trialinvuser")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram trial: %v", err)
		}
		// Exhaust the trial limit
		if _, err := st.RawPool().Exec(ctx,
			`UPDATE workspaces SET free_invoices_used=$1 WHERE id=$2`,
			TrialInvoiceLimit, trialWs.ID); err != nil {
			t.Fatalf("set free_invoices_used: %v", err)
		}
		trialWs.FreeInvoicesUsed = TrialInvoiceLimit

		_, err = svc.CreateInvoice(ctx, trialWs, CreateInvoiceInput{
			Title:          "Trial",
			BaseAmountUSD:  decimal.RequireFromString("10"),
			PayableNetwork: store.NetworkBASE,
		})
		if err == nil || !strings.Contains(err.Error(), "trial") {
			t.Fatalf("expected trial limit error, got %v", err)
		}
	})
}

// TestInvoiceServiceCreatePlanInvoiceWithDB tests CreateSubscriptionInvoice and CreatePlanInvoiceWithPrice.
func TestInvoiceServiceCreatePlanInvoiceWithDB(t *testing.T) {
	ctx := context.Background()
	st := newPaymentServiceTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 88200, "planinvuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	svc := NewInvoiceService(st, "5.0")

	t.Run("CreatePlanInvoiceWithPrice requires billing wallet configured", func(t *testing.T) {
		_, err := svc.CreatePlanInvoiceWithPrice(ctx, workspace, store.PlanCodeMerchant, store.NetworkTON, nil)
		if err == nil || !strings.Contains(err.Error(), "billing wallet") {
			t.Fatalf("expected billing wallet error, got %v", err)
		}
	})

	t.Run("CreatePlanInvoiceWithPrice rejects blocked workspace", func(t *testing.T) {
		blockedWs, err := st.UpsertWorkspaceByTelegram(ctx, 88201, "blockedplanuser")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
		}
		if _, err := st.SetWorkspaceBlocked(ctx, blockedWs.ID, true); err != nil {
			t.Fatalf("SetWorkspaceBlocked: %v", err)
		}
		blockedWs.IsBlocked = true

		_, err = svc.CreatePlanInvoiceWithPrice(ctx, blockedWs, store.PlanCodeMerchant, store.NetworkTON, nil)
		if err == nil || !strings.Contains(err.Error(), "blocked") {
			t.Fatalf("expected blocked error, got %v", err)
		}
	})

	t.Run("CreatePlanInvoiceWithPrice rejects trial plan", func(t *testing.T) {
		_, err := svc.CreatePlanInvoiceWithPrice(ctx, workspace, store.PlanCodeTrial, store.NetworkTON, nil)
		if err == nil || !strings.Contains(err.Error(), "trial") {
			t.Fatalf("expected trial plan error, got %v", err)
		}
	})

	t.Run("CreatePlanInvoiceWithPrice rejects unsupported network", func(t *testing.T) {
		_, err := svc.CreatePlanInvoiceWithPrice(ctx, workspace, store.PlanCodeMerchant, "DOGE", nil)
		if err == nil || !strings.Contains(err.Error(), "unsupported") {
			t.Fatalf("expected unsupported network error, got %v", err)
		}
	})

	t.Run("CreatePlanInvoiceWithPrice with override price zero rejected", func(t *testing.T) {
		zero := decimal.Zero
		_, err := svc.CreatePlanInvoiceWithPrice(ctx, workspace, store.PlanCodeBusiness, store.NetworkTON, &zero)
		if err == nil {
			t.Fatal("expected error for zero override price")
		}
	})

	t.Run("CreateSubscriptionInvoice delegates to CreatePlanInvoice", func(t *testing.T) {
		// This should hit the billing wallet missing error path via CreatePlanInvoiceWithPrice
		_, err := svc.CreateSubscriptionInvoice(ctx, workspace, store.NetworkTON)
		if err == nil || !strings.Contains(err.Error(), "billing wallet") {
			t.Fatalf("expected billing wallet error from CreateSubscriptionInvoice, got %v", err)
		}
	})

	t.Run("CreatePlanInvoice success when billing wallet configured", func(t *testing.T) {
		// Configure billing wallet for TON — stored as a JSON map under "billing_wallets"
		wallets := map[string]string{"TON": "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHaWqcn"}
		if err := st.UpsertSystemConfig(ctx, "billing_wallets", wallets, true, "test"); err != nil {
			t.Fatalf("UpsertSystemConfig billing wallet: %v", err)
		}
		t.Cleanup(func() {
			_ = st.UpsertSystemConfig(ctx, "billing_wallets", map[string]string{}, true, "test")
		})

		inv, err := svc.CreatePlanInvoice(ctx, workspace, store.PlanCodeMerchant, store.NetworkTON)
		if err != nil {
			t.Fatalf("CreatePlanInvoice: %v", err)
		}
		if inv.PublicID == "" {
			t.Fatal("expected PublicID to be set")
		}
		if inv.Kind != store.InvoiceKindSubscription {
			t.Fatalf("expected subscription kind, got %s", inv.Kind)
		}
	})

	t.Run("CreatePlanInvoice applies promo discount", func(t *testing.T) {
		// Configure billing wallet for TON
		wallets := map[string]string{"TON": "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHaWqBB"}
		if err := st.UpsertSystemConfig(ctx, "billing_wallets", wallets, true, "test"); err != nil {
			t.Fatalf("UpsertSystemConfig billing wallet: %v", err)
		}
		t.Cleanup(func() {
			_ = st.UpsertSystemConfig(ctx, "billing_wallets", map[string]string{}, true, "test")
		})

		// Create workspace with a discount applied: 20% on plan business
		wsDisc, err := st.UpsertWorkspaceByTelegram(ctx, 99400, "discuser")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
		}
		
		// Create discount promo code and redeem it for the workspace
		p, err := st.CreatePromoCode(ctx, "DISCOUNT20BIZ", 0, store.PlanCodeBusiness, nil, nil, 20, "admin")
		if err != nil {
			t.Fatalf("CreatePromoCode: %v", err)
		}
		wsDisc, err = st.RedeemPromoCode(ctx, wsDisc.ID, p.Code)
		if err != nil {
			t.Fatalf("RedeemPromoCode: %v", err)
		}

		// 1. Create plan invoice for a DIFFERENT plan (e.g. PlanCodeMerchant = $9)
		// Since discount is restricted to PlanCodeBusiness, this should have NO discount applied.
		invMerch, err := svc.CreatePlanInvoice(ctx, wsDisc, store.PlanCodeMerchant, store.NetworkTON)
		if err != nil {
			t.Fatalf("CreatePlanInvoice (Merchant): %v", err)
		}
		expectedMerchPrice := decimal.RequireFromString("9")
		if !invMerch.BaseAmountUSD.Equal(expectedMerchPrice) {
			t.Errorf("Expected price %s for Merchant plan (no discount), got %s", expectedMerchPrice, invMerch.BaseAmountUSD)
		}

		// 2. Create plan invoice for the business plan ($79)
		// This should have 20% discount applied: $79 * 0.8 = $63.20
		invBiz, err := svc.CreatePlanInvoice(ctx, wsDisc, store.PlanCodeBusiness, store.NetworkTON)
		if err != nil {
			t.Fatalf("CreatePlanInvoice (Business): %v", err)
		}
		expectedBizPrice := decimal.RequireFromString("63.20")
		if !invBiz.BaseAmountUSD.Equal(expectedBizPrice) {
			t.Errorf("Expected discounted price %s for Business plan, got %s", expectedBizPrice, invBiz.BaseAmountUSD)
		}
	})

	t.Run("CreatePlanInvoice with custom subscription days", func(t *testing.T) {
		// Configure billing wallet for TON
		wallets := map[string]string{"TON": "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHaWqCC"}
		if err := st.UpsertSystemConfig(ctx, "billing_wallets", wallets, true, "test"); err != nil {
			t.Fatalf("UpsertSystemConfig billing wallet: %v", err)
		}
		t.Cleanup(func() {
			_ = st.UpsertSystemConfig(ctx, "billing_wallets", map[string]string{}, true, "test")
		})

		// 1. Minimum duration validation (less than 14 days must fail)
		_, err := svc.CreatePlanInvoiceWithPriceAndOptions(ctx, workspace, store.PlanCodeDeveloper, []PaymentOptionInput{{Network: store.NetworkTON}}, nil, 10)
		if err == nil || !strings.Contains(err.Error(), "at least 14 days") {
			t.Fatalf("expected error for <14 days subscription, got: %v", err)
		}

		// 2. Custom 14 days on Developer Plan ($29/30 * 14 = $13.53)
		invCustom, err := svc.CreatePlanInvoiceWithPriceAndOptions(ctx, workspace, store.PlanCodeDeveloper, []PaymentOptionInput{{Network: store.NetworkTON}}, nil, 14)
		if err != nil {
			t.Fatalf("CreatePlanInvoiceWithPriceAndOptions custom days: %v", err)
		}
		expectedPrice := decimal.RequireFromString("13.53")
		if !invCustom.BaseAmountUSD.Equal(expectedPrice) {
			t.Errorf("expected price %s, got %s", expectedPrice, invCustom.BaseAmountUSD)
		}
		if invCustom.SubscriptionDays != 14 {
			t.Errorf("expected subscription days 14, got %d", invCustom.SubscriptionDays)
		}
		if invCustom.Title != "recv Developer · 14 days" {
			t.Errorf("expected title 'recv Developer · 14 days', got '%s'", invCustom.Title)
		}
	})
}

// TestInvoiceServiceCreateInvoiceWalletBranches tests wallet selection logic.
func TestInvoiceServiceCreateInvoiceWalletBranches(t *testing.T) {
	ctx := context.Background()
	st := newPaymentServiceTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 88300, "walletbranchuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	svc := NewInvoiceService(st, "5.0")

	t.Run("CreateInvoice with specific wallet ID that mismatches network fails", func(t *testing.T) {
		tonWallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkTON, "UQBS_test_ton_addr_000000000000000000000000000")
		if err != nil {
			t.Fatalf("CreateWallet TON: %v", err)
		}

		_, err = svc.CreateInvoice(ctx, workspace, CreateInvoiceInput{
			Title:          "Mismatch",
			BaseAmountUSD:  decimal.RequireFromString("10"),
			PayableNetwork: store.NetworkBASE, // BASE payable network but TON wallet
			WalletID:       tonWallet.ID,
		})
		if err == nil || !strings.Contains(err.Error(), "network") {
			t.Fatalf("expected network mismatch error, got %v", err)
		}
	})

	t.Run("CreateInvoice without wallet and no active wallet fails", func(t *testing.T) {
		// No wallet created for BSC → active wallet lookup fails
		_, err = svc.CreateInvoice(ctx, workspace, CreateInvoiceInput{
			Title:          "No Wallet",
			BaseAmountUSD:  decimal.RequireFromString("10"),
			PayableNetwork: store.NetworkBSC,
		})
		if err == nil {
			t.Fatal("expected error when no active wallet for network")
		}
	})

	t.Run("CreateInvoice with non-existent wallet ID fails", func(t *testing.T) {
		_, err = svc.CreateInvoice(ctx, workspace, CreateInvoiceInput{
			Title:          "BadWallet",
			BaseAmountUSD:  decimal.RequireFromString("10"),
			PayableNetwork: store.NetworkBASE,
			WalletID:       99999999,
		})
		if err == nil {
			t.Fatal("expected error for non-existent wallet ID")
		}
	})
}
