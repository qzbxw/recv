package service

import (
	"context"
	"encoding/json"
	"io"
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"

	"recv/backend/internal/store"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
	"github.com/shopspring/decimal"
)

var emptyPayload = json.RawMessage(`{}`)

// TestPaymentServiceBusinessFlows exercises the core payment matching rules against
// a real database to ensure business outcomes remain stable when implementation changes.
func TestPaymentServiceBusinessFlows(t *testing.T) {
	ctx := context.Background()
	st := newPaymentServiceTestStore(t, ctx)
	paymentSvc := NewPaymentService(st)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 9001, "paytester")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	wallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0x1111111111111111111111111111111111111111")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	t.Run("exact amount transfer matches invoice", func(t *testing.T) {
		suffix := decimal.RequireFromString("0.000777")
		payable := decimal.RequireFromString("10.000777")
		inv, err := st.CreateInvoice(ctx, store.CreateInvoiceParams{
			WorkspaceID:        workspace.ID,
			Kind:               store.InvoiceKindMerchant,
			Title:              "Test Invoice",
			BaseAmountUSD:      decimal.RequireFromString("10"),
			PayableNetwork:     store.NetworkBASE,
			DestinationAddress: wallet.Address,
			PayableAmount:      payable,
			MatchingSuffix:     &suffix,
			PublicID:           "TEST001",
			Mode:               "live",
			ExpiresAt:          time.Now().UTC().Add(time.Hour),
		})
		if err != nil {
			t.Fatalf("CreateInvoice: %v", err)
		}

		transfer := store.ObservedTransfer{
			TxHash:             "0xabc001",
			Network:            store.NetworkBASE,
			DestinationAddress: wallet.Address,
			Amount:             payable,
			ObservedAt:         time.Now().UTC(),
			RawPayload:         emptyPayload,
		}
		result, err := paymentSvc.ProcessObservedTransfer(ctx, transfer)
		if err != nil {
			t.Fatalf("ProcessObservedTransfer: %v", err)
		}
		if result.Classification != "paid_exact" {
			t.Fatalf("expected paid_exact, got %q", result.Classification)
		}
		if result.Invoice == nil || result.Invoice.ID != inv.ID {
			t.Fatalf("expected invoice to be matched, got %+v", result.Invoice)
		}
		if result.Invoice.Status != store.InvoiceStatusPaid {
			t.Fatalf("expected paid status, got %s", result.Invoice.Status)
		}
	})

	t.Run("duplicate transfer is ignored", func(t *testing.T) {
		transfer := store.ObservedTransfer{
			TxHash:             "0xabc001",
			Network:            store.NetworkBASE,
			DestinationAddress: wallet.Address,
			Amount:             decimal.RequireFromString("10.000777"),
			ObservedAt:         time.Now().UTC(),
			RawPayload:         emptyPayload,
		}
		result, err := paymentSvc.ProcessObservedTransfer(ctx, transfer)
		if err != nil {
			t.Fatalf("ProcessObservedTransfer: %v", err)
		}
		if result.Classification != "duplicate" {
			t.Fatalf("expected duplicate, got %q", result.Classification)
		}
	})

	t.Run("transfer with no matching invoice is unmatched", func(t *testing.T) {
		transfer := store.ObservedTransfer{
			TxHash:             "0xunknown",
			Network:            store.NetworkBASE,
			DestinationAddress: wallet.Address,
			Amount:             decimal.RequireFromString("99.999999"),
			ObservedAt:         time.Now().UTC(),
			RawPayload:         emptyPayload,
		}
		result, err := paymentSvc.ProcessObservedTransfer(ctx, transfer)
		if err != nil {
			t.Fatalf("ProcessObservedTransfer: %v", err)
		}
		if result.Classification != "unmatched" {
			t.Fatalf("expected unmatched, got %q", result.Classification)
		}
		if result.Invoice != nil {
			t.Fatal("expected no invoice for unmatched transfer")
		}
	})

	t.Run("underpaid transfer marks invoice underpaid", func(t *testing.T) {
		// Invoice with no fractional suffix so FindPotentialUnderpaidInvoice matches
		// round amounts (fractions 0 == 0).
		payable := decimal.RequireFromString("50.000000")
		_, err := st.CreateInvoice(ctx, store.CreateInvoiceParams{
			WorkspaceID:        workspace.ID,
			Kind:               store.InvoiceKindMerchant,
			Title:              "Underpaid Invoice",
			BaseAmountUSD:      decimal.RequireFromString("50"),
			PayableNetwork:     store.NetworkBASE,
			DestinationAddress: wallet.Address,
			PayableAmount:      payable,
			PublicID:           "TEST002",
			Mode:               "live",
			ExpiresAt:          time.Now().UTC().Add(time.Hour),
		})
		if err != nil {
			t.Fatalf("CreateInvoice: %v", err)
		}

		// Pay 49 — same fractional part (0), difference 1 ≤ 2.5 → FindPotentialUnderpaidInvoice
		// finds the invoice, then DecideInvoicePaymentStatus classifies as underpaid.
		transfer := store.ObservedTransfer{
			TxHash:             "0xunder002",
			Network:            store.NetworkBASE,
			DestinationAddress: wallet.Address,
			Amount:             decimal.RequireFromString("49.000000"),
			ObservedAt:         time.Now().UTC(),
			RawPayload:         emptyPayload,
		}
		result, err := paymentSvc.ProcessObservedTransfer(ctx, transfer)
		if err != nil {
			t.Fatalf("ProcessObservedTransfer: %v", err)
		}
		if result.Classification != "underpaid" {
			t.Fatalf("expected underpaid, got %q", result.Classification)
		}
		if result.Invoice == nil || result.Invoice.Status != store.InvoiceStatusUnderpaid {
			t.Fatalf("expected underpaid invoice, got %+v", result.Invoice)
		}
	})

	t.Run("TON transfer matched by payment comment", func(t *testing.T) {
		tonWallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkTON, "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P")
		if err != nil {
			t.Fatalf("CreateWallet TON: %v", err)
		}
		comment := "RECV-TONTEST"
		tonAmount := decimal.RequireFromString("2.500000")
		_, err = st.CreateInvoice(ctx, store.CreateInvoiceParams{
			WorkspaceID:        workspace.ID,
			Kind:               store.InvoiceKindMerchant,
			Title:              "TON Invoice",
			BaseAmountUSD:      decimal.RequireFromString("10"),
			PayableNetwork:     store.NetworkTON,
			DestinationAddress: tonWallet.Address,
			PayableAmount:      tonAmount,
			PaymentComment:     &comment,
			PublicID:           "TONTEST",
			Mode:               "live",
			ExpiresAt:          time.Now().UTC().Add(time.Hour),
		})
		if err != nil {
			t.Fatalf("CreateInvoice TON: %v", err)
		}

		transfer := store.ObservedTransfer{
			TxHash:             "ton-tx-999",
			Network:            store.NetworkTON,
			DestinationAddress: tonWallet.Address,
			Amount:             tonAmount,
			PaymentComment:     comment,
			ObservedAt:         time.Now().UTC(),
			RawPayload:         emptyPayload,
		}
		result, err := paymentSvc.ProcessObservedTransfer(ctx, transfer)
		if err != nil {
			t.Fatalf("ProcessObservedTransfer TON: %v", err)
		}
		if result.Classification != "paid_exact" {
			t.Fatalf("expected paid_exact for TON, got %q", result.Classification)
		}
		if result.Invoice == nil || result.Invoice.Status != store.InvoiceStatusPaid {
			t.Fatalf("expected paid TON invoice, got %+v", result.Invoice)
		}
	})

	t.Run("TON transfer without comment is unmatched", func(t *testing.T) {
		transfer := store.ObservedTransfer{
			TxHash:             "ton-tx-nocomment",
			Network:            store.NetworkTON,
			DestinationAddress: "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P",
			Amount:             decimal.RequireFromString("1"),
			PaymentComment:     "",
			ObservedAt:         time.Now().UTC(),
			RawPayload:         emptyPayload,
		}
		result, err := paymentSvc.ProcessObservedTransfer(ctx, transfer)
		if err != nil {
			t.Fatalf("ProcessObservedTransfer TON no comment: %v", err)
		}
		if result.Classification != "unmatched" {
			t.Fatalf("expected unmatched for TON without comment, got %q", result.Classification)
		}
	})
}

// TestPaymentServiceAmbiguousMatch verifies that ambiguous matches are handled correctly.
func TestPaymentServiceAmbiguousMatch(t *testing.T) {
	ctx := context.Background()
	st := newPaymentServiceTestStore(t, ctx)
	paymentSvc := NewPaymentService(st)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 9002, "ambiguser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0x2222222222222222222222222222222222222222")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	// Create invoice 1 with a specific suffix
	sameAmount := decimal.RequireFromString("42.000777")
	suffix := decimal.RequireFromString("0.000777")
	inv1, err := st.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "Ambiguous Invoice 1",
		BaseAmountUSD:      decimal.RequireFromString("42"),
		PayableNetwork:     store.NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      sameAmount,
		MatchingSuffix:     &suffix,
		PublicID:           "AMBIG001",
		Mode:               "live",
		ExpiresAt:          time.Now().UTC().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice 1: %v", err)
	}

	// Expire invoice 1 so the suffix is freed
	if _, err := st.RawPool().Exec(ctx, `UPDATE invoices SET status = 'expired' WHERE id = $1`, inv1.ID); err != nil {
		t.Fatalf("expire invoice 1: %v", err)
	}

	// Create invoice 2 with the same suffix (now available since invoice 1 is expired)
	_, err = st.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "Ambiguous Invoice 2",
		BaseAmountUSD:      decimal.RequireFromString("42"),
		PayableNetwork:     store.NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      sameAmount,
		MatchingSuffix:     &suffix,
		PublicID:           "AMBIG002",
		Mode:               "live",
		ExpiresAt:          time.Now().UTC().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice 2: %v", err)
	}

	// Restore invoice 1 to awaiting_payment so both are active
	if _, err := st.RawPool().Exec(ctx, `UPDATE invoices SET status = 'awaiting_payment' WHERE id = $1`, inv1.ID); err != nil {
		t.Fatalf("restore invoice 1: %v", err)
	}

	// ProcessObservedTransfer should get ambiguous match and return "ambiguous_match" classification
	transfer := store.ObservedTransfer{
		TxHash:             "0xambiguous001",
		Network:            store.NetworkBASE,
		DestinationAddress: wallet.Address,
		Amount:             sameAmount,
		ObservedAt:         time.Now().UTC(),
		RawPayload:         emptyPayload,
	}
	result, err := paymentSvc.ProcessObservedTransfer(ctx, transfer)
	if err != nil {
		t.Fatalf("ProcessObservedTransfer: %v", err)
	}
	if result.Classification != "ambiguous_match" {
		t.Fatalf("expected ambiguous_match classification, got %q", result.Classification)
	}
}

// TestPaymentServiceSubscriptionInvoice verifies that paying a subscription invoice
// triggers applyInvoicePostPaymentEffects (extending the workspace plan).
func TestPaymentServiceSubscriptionInvoice(t *testing.T) {
	ctx := context.Background()
	st := newPaymentServiceTestStore(t, ctx)
	paymentSvc := NewPaymentService(st)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 9100, "subpayuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0x3333333333333333333333333333333333333333")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	// Configure billing webhook endpoint so enqueueWebhookEventsTx also runs
	wh, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "sub-test-hook", "https://example.com/hook", "secret", "live")
	if err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}
	_ = wh

	// Give developer plan so webhook retries > 0
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	_, err = st.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID)
	if err != nil {
		t.Fatalf("set plan: %v", err)
	}

	payable := decimal.RequireFromString("10.000555")
	suffix := decimal.RequireFromString("0.000555")
	subscriptionInv, err := st.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindSubscription,
		Title:              "Merchant Subscription",
		BaseAmountUSD:      decimal.RequireFromString("10"),
		PayableNetwork:     store.NetworkEVM,
		DestinationAddress: wallet.Address,
		PayableAmount:      payable,
		MatchingSuffix:     &suffix,
		PublicID:           "SUBPAY001",
		SubscriptionDays:   30,
		PlanCode:           store.PlanCodeMerchant,
		Mode:               "live",
		ExpiresAt:          time.Now().UTC().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice subscription: %v", err)
	}

	t.Run("paying subscription invoice extends workspace plan", func(t *testing.T) {
		transfer := store.ObservedTransfer{
			TxHash:             "0xsubpay001",
			Network:            store.NetworkEVM,
			DestinationAddress: wallet.Address,
			Amount:             payable,
			ObservedAt:         time.Now().UTC(),
			RawPayload:         emptyPayload,
		}
		result, err := paymentSvc.ProcessObservedTransfer(ctx, transfer)
		if err != nil {
			t.Fatalf("ProcessObservedTransfer: %v", err)
		}
		if result.Classification != "paid_exact" {
			t.Fatalf("expected paid_exact, got %q", result.Classification)
		}
		if result.Invoice == nil || result.Invoice.ID != subscriptionInv.ID {
			t.Fatal("expected subscription invoice to be matched")
		}
		if result.Invoice.Status != store.InvoiceStatusPaid {
			t.Fatalf("expected paid status, got %s", result.Invoice.Status)
		}
	})
}

func newPaymentServiceTestStore(t *testing.T, ctx context.Context) *store.Store {
	t.Helper()

	port := pickPaymentServiceTestPort(t)
	baseDir := t.TempDir()
	pgConfig := embeddedpostgres.DefaultConfig().
		Version(embeddedpostgres.V16).
		Port(port).
		Database("recv").
		Username("recv").
		Password("recv").
		RuntimePath(filepath.Join(baseDir, "runtime")).
		DataPath(filepath.Join(baseDir, "data")).
		CachePath(filepath.Join(os.TempDir(), "recv-embedded-postgres-cache")).
		Locale("C").
		Encoding("UTF8").
		StartTimeout(45 * time.Second).
		StartParameters(map[string]string{
			"fsync":              "off",
			"synchronous_commit": "off",
			"full_page_writes":   "off",
		}).
		Logger(io.Discard)

	database := embeddedpostgres.NewDatabase(pgConfig)
	if err := database.Start(); err != nil {
		t.Fatalf("embedded postgres start failed: %v", err)
	}
	t.Cleanup(func() {
		_ = database.Stop()
	})

	st, err := store.New(ctx, pgConfig.GetConnectionURL()+"?sslmode=disable")
	if err != nil {
		t.Fatalf("store.New: %v", err)
	}
	t.Cleanup(st.Close)
	return st
}

func pickPaymentServiceTestPort(t *testing.T) uint32 {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to pick free port: %v", err)
	}
	defer listener.Close()
	return uint32(listener.Addr().(*net.TCPAddr).Port)
}
