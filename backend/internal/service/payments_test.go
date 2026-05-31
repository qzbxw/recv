package service

import (
	"testing"
	"time"

	"reqst/backend/internal/store"

	"github.com/shopspring/decimal"
)

func TestClassifyInvoiceTransfer(t *testing.T) {
	now := time.Now().UTC()
	baseInvoice := store.Invoice{
		ID:            1,
		PublicID:      "INV123",
		PayableAmount: decimal.RequireFromString("150.013742"),
		MatchingSuffix: func() *decimal.Decimal {
			value := decimal.RequireFromString("0.013742")
			return &value
		}(),
		Status:    store.InvoiceStatusAwaitingPayment,
		ExpiresAt: now.Add(30 * time.Minute),
	}

	t.Run("paid exact", func(t *testing.T) {
		decision := store.DecideInvoicePaymentStatus(baseInvoice, decimal.RequireFromString("150.013742"), now, "")
		if decision.Classification != "paid_exact" {
			t.Fatalf("expected paid_exact, got %s", decision.Classification)
		}
		if decision.Status != store.InvoiceStatusPaid {
			t.Fatalf("expected paid status, got %s", decision.Status)
		}
	})

	t.Run("underpaid", func(t *testing.T) {
		decision := store.DecideInvoicePaymentStatus(baseInvoice, decimal.RequireFromString("150.000000"), now, "")
		if decision.Classification != "underpaid" {
			t.Fatalf("expected underpaid, got %s", decision.Classification)
		}
		if decision.Status != store.InvoiceStatusUnderpaid {
			t.Fatalf("expected underpaid status, got %s", decision.Status)
		}
	})

	t.Run("underpaid fee window", func(t *testing.T) {
		decision := store.DecideInvoicePaymentStatus(baseInvoice, decimal.RequireFromString("149.013742"), now, "")
		if decision.Classification != "underpaid_fee_window" {
			t.Fatalf("expected underpaid_fee_window, got %s", decision.Classification)
		}
		if decision.Status != store.InvoiceStatusUnderpaid {
			t.Fatalf("expected underpaid status, got %s", decision.Status)
		}
	})

	t.Run("late payment", func(t *testing.T) {
		decision := store.DecideInvoicePaymentStatus(baseInvoice, decimal.RequireFromString("150.013742"), now.Add(31*time.Minute), "")
		if decision.Classification != "late_payment" {
			t.Fatalf("expected late_payment, got %s", decision.Classification)
		}
		if decision.Status != store.InvoiceStatusManualReview {
			t.Fatalf("expected manual_review status, got %s", decision.Status)
		}
	})

	t.Run("already expired invoice", func(t *testing.T) {
		invoice := baseInvoice
		invoice.Status = store.InvoiceStatusExpired
		decision := store.DecideInvoicePaymentStatus(invoice, decimal.RequireFromString("150.013742"), now, "")
		if decision.Classification != "late_payment" {
			t.Fatalf("expected late_payment, got %s", decision.Classification)
		}
		if decision.Status != store.InvoiceStatusManualReview {
			t.Fatalf("expected manual_review status, got %s", decision.Status)
		}
	})

	t.Run("overpaid", func(t *testing.T) {
		decision := store.DecideInvoicePaymentStatus(baseInvoice, decimal.RequireFromString("151.013742"), now, "")
		if decision.Classification != "overpaid" {
			t.Fatalf("expected overpaid, got %s", decision.Classification)
		}
		if decision.Status != store.InvoiceStatusOverpaid {
			t.Fatalf("expected overpaid status, got %s", decision.Status)
		}
	})

	t.Run("cumulative underpayment completes invoice", func(t *testing.T) {
		invoice := baseInvoice
		invoice.ReceivedAmount = decimal.RequireFromString("100.000000")
		decision := store.DecideInvoicePaymentStatus(invoice, decimal.RequireFromString("50.013742"), now, "")
		if decision.Classification != "paid_exact" {
			t.Fatalf("expected paid_exact, got %s", decision.Classification)
		}
		if decision.Status != store.InvoiceStatusPaid {
			t.Fatalf("expected paid status, got %s", decision.Status)
		}
	})
}

func TestNormalizeObservedTransfer(t *testing.T) {
	transfer := store.ObservedTransfer{
		TxHash:             "tx-1",
		Network:            store.NetworkTON,
		DestinationAddress: "wallet-1",
		Amount:             decimal.RequireFromString("1.5"),
	}

	if err := NormalizeObservedTransfer(&transfer); err != nil {
		t.Fatalf("NormalizeObservedTransfer returned error: %v", err)
	}
	if transfer.ObservedAt.IsZero() {
		t.Fatal("expected observed_at to be defaulted")
	}

	invalid := store.ObservedTransfer{
		Network:            store.NetworkTON,
		DestinationAddress: "wallet-1",
		Amount:             decimal.RequireFromString("1.5"),
	}
	if err := NormalizeObservedTransfer(&invalid); err == nil {
		t.Fatal("expected missing tx_hash error")
	}
}

func TestIsLikelyExchangeFeeUnderpayment(t *testing.T) {
	suffix := decimal.RequireFromString("0.013742")
	invoice := store.Invoice{
		PayableAmount:  decimal.RequireFromString("150.013742"),
		MatchingSuffix: &suffix,
		Status:         store.InvoiceStatusAwaitingPayment,
		ExpiresAt:      time.Now().UTC().Add(time.Hour),
	}

	if store.DecideInvoicePaymentStatus(invoice, decimal.RequireFromString("149.013742"), time.Now().UTC(), "").Classification != "underpaid_fee_window" {
		t.Fatal("expected amount to be classified as likely exchange fee underpayment")
	}
	if store.DecideInvoicePaymentStatus(invoice, decimal.RequireFromString("149.010000"), time.Now().UTC(), "").Classification == "underpaid_fee_window" {
		t.Fatal("expected different fractional part to be rejected")
	}
}
