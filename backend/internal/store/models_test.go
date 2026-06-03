package store

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/shopspring/decimal"
)

func TestNetworkHelpers(t *testing.T) {
	if got := NetworkBASE.WalletBucket(); got != NetworkEVM {
		t.Fatalf("expected base wallet bucket to map to EVM, got %s", got)
	}
	if !NetworkTON.IsSupportedWalletNetwork() {
		t.Fatal("expected TON to be a supported wallet network")
	}
	if NetworkBASE.IsSupportedWalletNetwork() {
		t.Fatal("expected BASE not to be a direct wallet network")
	}
	if !NetworkBASE.IsSupportedPayableNetwork() {
		t.Fatal("expected BASE to be a supported payable network")
	}
	if !NetworkTON_USDT.IsSupportedPayableNetwork() {
		t.Fatal("expected TON_USDT to be a supported payable network")
	}
}

func TestValidateWalletAddress(t *testing.T) {
	validCases := map[Network]string{
		NetworkTON:    "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P",
		NetworkTRON:   "TYNY19wFMM24dJN4ciyuGZDNzzQHVcaMPd",
		NetworkEVM:    "0x1111111111111111111111111111111111111111",
		NetworkSOLANA: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
	}
	for network, address := range validCases {
		if err := ValidateWalletAddress(network, address); err != nil {
			t.Fatalf("expected %s address to be valid, got %v", network, err)
		}
	}

	if err := ValidateWalletAddress(NetworkTRON, "invalid"); err == nil {
		t.Fatal("expected invalid TRON address error")
	}
	if err := ValidateWalletAddress(Network("DOGE"), "abc"); err == nil {
		t.Fatal("expected unsupported network error")
	}
}

func TestInvoiceIsExpired(t *testing.T) {
	now := time.Now()
	if !(Invoice{
		Status:    InvoiceStatusAwaitingPayment,
		ExpiresAt: now.Add(-time.Minute),
	}.IsExpired(now)) {
		t.Fatal("expected awaiting invoice past due date to be expired")
	}
	if (Invoice{
		Status:    InvoiceStatusPaid,
		ExpiresAt: now.Add(-time.Minute),
	}.IsExpired(now)) {
		t.Fatal("expected paid invoice not to be treated as expired")
	}
}

func TestPlanHelpers(t *testing.T) {
	if got := NormalizePlanCode(" developer "); got != PlanCodeDeveloper {
		t.Fatalf("expected developer plan code, got %s", got)
	}
	if got := NormalizePlanCode("unknown"); got != PlanCodeTrial {
		t.Fatalf("expected fallback trial plan, got %s", got)
	}
	if got := ResolvePlan(PlanCodeMerchant).PriceUSDString; got != "9" {
		t.Fatalf("unexpected merchant price string: %s", got)
	}
	if plans := ListPaidPlans(); len(plans) != 3 {
		t.Fatalf("expected three paid plans, got %d", len(plans))
	}
}

func TestWorkspaceEffectivePlan(t *testing.T) {
	now := time.Now()
	activeUntil := now.Add(24 * time.Hour)

	workspace := Workspace{
		PlanCode:           PlanCodeDeveloper,
		SubscriptionEndsAt: &activeUntil,
	}
	if got := workspace.EffectivePlanCode(now); got != PlanCodeDeveloper {
		t.Fatalf("expected developer plan, got %s", got)
	}

	trialWorkspace := Workspace{
		PlanCode:           PlanCodeTrial,
		SubscriptionEndsAt: &activeUntil,
	}
	if got := trialWorkspace.EffectivePlanCode(now); got != PlanCodeMerchant {
		t.Fatalf("expected paid trial subscription to upgrade to merchant, got %s", got)
	}

	expiredWorkspace := Workspace{
		PlanCode:           PlanCodeBusiness,
		SubscriptionEndsAt: ptrTime(now.Add(-time.Hour)),
	}
	if got := expiredWorkspace.EffectivePlanCode(now); got != PlanCodeTrial {
		t.Fatalf("expected expired subscription to fall back to trial, got %s", got)
	}
	if got := workspace.EffectivePlan(now).Code; got != PlanCodeDeveloper {
		t.Fatalf("expected effective plan developer, got %s", got)
	}
}

func TestMustJSON(t *testing.T) {
	raw := MustJSON(map[string]any{
		"ok":     true,
		"amount": decimal.RequireFromString("1.50"),
	})
	if len(raw) == 0 {
		t.Fatal("expected JSON payload to be marshaled")
	}
	if got := valueOrEmpty(nil); got != "" {
		t.Fatalf("expected empty string for nil value, got %q", got)
	}
	value := "hello"
	if got := valueOrEmpty(&value); got != "hello" {
		t.Fatalf("expected hello, got %q", got)
	}
	if got := payableScale(NetworkTON); got != 6 {
		t.Fatalf("expected TON payable scale 6, got %d", got)
	}
}

func ptrTime(value time.Time) *time.Time {
	return &value
}

func TestResolvePlan(t *testing.T) {
	tests := []struct {
		name     string
		input    PlanCode
		expected PlanCode
	}{
		{name: "valid trial", input: PlanCodeTrial, expected: PlanCodeTrial},
		{name: "valid merchant", input: PlanCodeMerchant, expected: PlanCodeMerchant},
		{name: "valid developer", input: PlanCodeDeveloper, expected: PlanCodeDeveloper},
		{name: "enterprise maps to business", input: "enterprise", expected: PlanCodeBusiness},
		{name: "uppercase valid pro->merchant", input: "PRO", expected: PlanCodeMerchant},
		{name: "padded valid dev->developer", input: "  developer  ", expected: PlanCodeDeveloper},
		{name: "unknown fallback to trial", input: "unknown", expected: PlanCodeTrial},
		{name: "empty string fallback to trial", input: "", expected: PlanCodeTrial},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := ResolvePlan(tc.input)
			if got.Code != tc.expected {
				t.Errorf("ResolvePlan(%q) = %v; want %v", tc.input, got.Code, tc.expected)
			}
		})
	}
}

func TestNetworkWalletBucket(t *testing.T) {
	cases := map[Network]Network{
		NetworkBASE:     NetworkEVM,
		NetworkARBITRUM: NetworkEVM,
		NetworkBSC:      NetworkEVM,
		NetworkEVM:      NetworkEVM,
		NetworkSOLANA:   NetworkSOLANA,
		NetworkTON:      NetworkTON,
		NetworkTON_USDT: NetworkTON,
		NetworkTRON:     NetworkTRON,
	}
	for network, want := range cases {
		if got := network.WalletBucket(); got != want {
			t.Errorf("WalletBucket(%s) = %s; want %s", network, got, want)
		}
	}
}

func TestValidateWalletAddressEdgeCases(t *testing.T) {
	if err := ValidateWalletAddress(NetworkEVM, "0x"+strings.Repeat("1", 40)); err != nil {
		t.Fatalf("expected valid EVM address, got %v", err)
	}
	if err := ValidateWalletAddress(NetworkEVM, "0x"+strings.Repeat("1", 39)); err == nil {
		t.Fatal("expected too-short EVM address to be rejected")
	}
	if err := ValidateWalletAddress(NetworkEVM, strings.Repeat("1", 42)); err == nil {
		t.Fatal("expected EVM address without 0x prefix to be rejected")
	}
	if err := ValidateWalletAddress(NetworkTRON, "Tabc"); err == nil {
		t.Fatal("expected short TRON address to be rejected")
	}
	if err := ValidateWalletAddress(NetworkSOLANA, strings.Repeat("A", 45)); err == nil {
		t.Fatal("expected too-long Solana address to be rejected")
	}
	if err := ValidateWalletAddress(NetworkSOLANA, "0abc!"); err == nil {
		t.Fatal("expected invalid Solana address chars to be rejected")
	}
}

func TestWorkspaceHasActiveSubscription(t *testing.T) {
	now := time.Now()
	active := now.Add(time.Hour)
	expired := now.Add(-time.Hour)

	ws := Workspace{SubscriptionEndsAt: &active}
	if !ws.HasActiveSubscription(now) {
		t.Fatal("expected active subscription")
	}
	ws2 := Workspace{SubscriptionEndsAt: &expired}
	if ws2.HasActiveSubscription(now) {
		t.Fatal("expected expired subscription to be inactive")
	}
	if (Workspace{}).HasActiveSubscription(now) {
		t.Fatal("expected nil subscription to be inactive")
	}
}

func TestPlanDefinitionFields(t *testing.T) {
	merchant := ResolvePlan(PlanCodeMerchant)
	if !merchant.HasUnlimitedSales {
		t.Fatal("expected merchant to have unlimited sales")
	}
	if merchant.BillingDays != 30 {
		t.Fatalf("expected merchant billing days 30, got %d", merchant.BillingDays)
	}

	developer := ResolvePlan(PlanCodeDeveloper)
	if !developer.HasAPI || !developer.HasWebhooks {
		t.Fatal("expected developer plan to have API and webhooks")
	}

	trial := ResolvePlan(PlanCodeTrial)
	if trial.HasAPI || !trial.HasWebhooks {
		t.Fatal("expected trial plan to have webhooks but no API")
	}

	business := ResolvePlan(PlanCodeBusiness)
	if business.APIKeyLimit <= developer.APIKeyLimit {
		t.Fatal("expected business to have more API keys than developer")
	}
}

func TestAnalyticsBreakdownExpression(t *testing.T) {
	if got := analyticsBreakdownExpression("network"); got != "payable_network::text" {
		t.Fatalf("expected network expression, got %q", got)
	}
	if got := analyticsBreakdownExpression("plan"); got == "" {
		t.Fatal("expected non-empty plan expression")
	}
	if got := analyticsBreakdownExpression("mode"); got != "mode" {
		t.Fatalf("expected mode expression, got %q", got)
	}
	if got := analyticsBreakdownExpression("unknown"); got == "" {
		t.Fatal("expected fallback expression for unknown group")
	}
	if got := analyticsBreakdownExpression(""); got == "" {
		t.Fatal("expected fallback expression for empty group")
	}
}

func TestInvoiceWebhookEventType(t *testing.T) {
	cases := map[InvoiceStatus]string{
		InvoiceStatusPaid:         "invoice.paid",
		InvoiceStatusUnderpaid:    "invoice.underpaid",
		InvoiceStatusOverpaid:     "invoice.overpaid",
		InvoiceStatusManualReview: "invoice.manual_review",
		InvoiceStatusExpired:      "invoice.expired",
		InvoiceStatusDraft:        "invoice.updated",
	}
	for status, want := range cases {
		got := invoiceWebhookEventType(Invoice{Status: status})
		if got != want {
			t.Errorf("invoiceWebhookEventType(%q) = %q; want %q", status, got, want)
		}
	}
}

func TestInvoiceIsExpiredEdgeCases(t *testing.T) {
	now := time.Now()

	if (Invoice{Status: InvoiceStatusPaid, ExpiresAt: now.Add(-time.Minute)}).IsExpired(now) {
		t.Fatal("paid invoice should never be considered expired")
	}
	if (Invoice{Status: InvoiceStatusDraft, ExpiresAt: now.Add(-time.Minute)}).IsExpired(now) {
		t.Fatal("draft invoice should not be considered expired (only awaiting_payment is)")
	}
	if !(Invoice{Status: InvoiceStatusAwaitingPayment, ExpiresAt: now.Add(-time.Second)}).IsExpired(now) {
		t.Fatal("expected overdue awaiting_payment invoice to be expired")
	}
	if (Invoice{Status: InvoiceStatusAwaitingPayment, ExpiresAt: now.Add(time.Minute)}).IsExpired(now) {
		t.Fatal("expected future invoice not to be expired")
	}
}

func TestDecideInvoicePaymentStatusEdgeCases(t *testing.T) {
	now := time.Now().UTC()
	suffix := decimal.RequireFromString("0.013742")
	base := Invoice{
		PayableAmount:  decimal.RequireFromString("150.013742"),
		MatchingSuffix: &suffix,
		Status:         InvoiceStatusAwaitingPayment,
		ExpiresAt:      now.Add(time.Hour),
	}

	cases := []struct {
		name           string
		invoice        Invoice
		amount         decimal.Decimal
		observedAt     time.Time
		hint           string
		classification string
		status         InvoiceStatus
		reviewReason   bool
	}{
		{
			name:           "manual mark paid overrides amount",
			amount:         decimal.RequireFromString("1"),
			hint:           "manual_mark_paid",
			classification: "manual_mark_paid",
			status:         InvoiceStatusPaid,
		},
		{
			name:           "test simulated overrides amount",
			amount:         decimal.Zero,
			hint:           "test_simulated",
			classification: "test_simulated",
			status:         InvoiceStatusPaid,
		},
		{
			name:           "late payment enters manual review",
			amount:         decimal.RequireFromString("150.013742"),
			observedAt:     now.Add(2 * time.Hour),
			classification: "late_payment",
			status:         InvoiceStatusManualReview,
			reviewReason:   true,
		},
		{
			name: "already expired invoice enters manual review",
			invoice: func() Invoice {
				invoice := base
				invoice.Status = InvoiceStatusExpired
				return invoice
			}(),
			amount:         decimal.RequireFromString("150.013742"),
			classification: "late_payment",
			status:         InvoiceStatusManualReview,
			reviewReason:   true,
		},
		{
			name:           "underpaid outside fee window",
			amount:         decimal.RequireFromString("100.013742"),
			classification: "underpaid",
			status:         InvoiceStatusUnderpaid,
		},
		{
			name:           "underpaid likely fee window",
			amount:         decimal.RequireFromString("149.013742"),
			classification: "underpaid_fee_window",
			status:         InvoiceStatusUnderpaid,
		},
		{
			name:           "overpaid enters review",
			amount:         decimal.RequireFromString("151.013742"),
			classification: "overpaid",
			status:         InvoiceStatusOverpaid,
			reviewReason:   true,
		},
		{
			name:           "exact payment paid",
			amount:         decimal.RequireFromString("150.013742"),
			classification: "paid_exact",
			status:         InvoiceStatusPaid,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			invoice := tc.invoice
			if invoice.PayableAmount.IsZero() {
				invoice = base
			}
			observedAt := tc.observedAt
			if observedAt.IsZero() {
				observedAt = now
			}
			decision := DecideInvoicePaymentStatus(invoice, tc.amount, observedAt, tc.hint)
			if decision.Classification != tc.classification {
				t.Fatalf("classification = %q; want %q", decision.Classification, tc.classification)
			}
			if decision.Status != tc.status {
				t.Fatalf("status = %q; want %q", decision.Status, tc.status)
			}
			if (decision.ReviewReason != nil) != tc.reviewReason {
				t.Fatalf("review reason presence = %v; want %v", decision.ReviewReason != nil, tc.reviewReason)
			}
		})
	}
}

func TestTrimUsername(t *testing.T) {
	cases := map[string]string{
		"@alice":     "alice",
		"  @alice":   "alice",
		"@@team_bot": "team_bot",
		"alice":      "alice",
		"":           "",
		" @ ":        "",
	}
	for input, want := range cases {
		if got := trimUsername(input); got != want {
			t.Fatalf("trimUsername(%q) = %q; want %q", input, got, want)
		}
	}
}

func TestBuildInvoiceNotificationMessage(t *testing.T) {
	amount := decimal.RequireFromString("10.500000")
	expected := decimal.RequireFromString("11.000000")

	t.Run("subscription paid with merchant plan", func(t *testing.T) {
		inv := Invoice{
			Kind:             InvoiceKindSubscription,
			Status:           InvoiceStatusPaid,
			PlanCode:         PlanCodeMerchant,
			PayableNetwork:   NetworkTON,
			PayableAmount:    expected,
			SubscriptionDays: 30,
		}
		msg := buildInvoiceNotificationMessage(inv, "paid_exact", amount)
		if !strings.Contains(msg, "Subscription activated") {
			t.Fatalf("expected subscription message, got: %s", msg)
		}
	})

	t.Run("subscription paid with trial plan remaps to merchant", func(t *testing.T) {
		inv := Invoice{
			Kind:             InvoiceKindSubscription,
			Status:           InvoiceStatusPaid,
			PlanCode:         PlanCodeTrial,
			PayableNetwork:   NetworkTON,
			PayableAmount:    expected,
			SubscriptionDays: 30,
		}
		msg := buildInvoiceNotificationMessage(inv, "paid_exact", amount)
		if !strings.Contains(msg, "Subscription activated") {
			t.Fatalf("expected subscription message for trial plan, got: %s", msg)
		}
	})

	t.Run("merchant invoice paid", func(t *testing.T) {
		inv := Invoice{
			Kind:           InvoiceKindMerchant,
			Status:         InvoiceStatusPaid,
			PublicID:       "INV-001",
			PayableNetwork: NetworkEVM,
			PayableAmount:  expected,
		}
		msg := buildInvoiceNotificationMessage(inv, "paid_exact", amount)
		if !strings.Contains(msg, "Payment confirmed") || !strings.Contains(msg, "INV-001") {
			t.Fatalf("unexpected message: %s", msg)
		}
	})

	t.Run("underpaid with fee window classification", func(t *testing.T) {
		inv := Invoice{
			Kind:           InvoiceKindMerchant,
			Status:         InvoiceStatusUnderpaid,
			PublicID:       "INV-002",
			PayableNetwork: NetworkTRON,
			PayableAmount:  expected,
		}
		msg := buildInvoiceNotificationMessage(inv, "underpaid_fee_window", amount)
		if !strings.Contains(msg, "fee-related") {
			t.Fatalf("expected fee window message, got: %s", msg)
		}
	})

	t.Run("underpaid without fee window", func(t *testing.T) {
		inv := Invoice{
			Kind:           InvoiceKindMerchant,
			Status:         InvoiceStatusUnderpaid,
			PublicID:       "INV-003",
			PayableNetwork: NetworkTRON,
			PayableAmount:  expected,
		}
		msg := buildInvoiceNotificationMessage(inv, "underpaid", amount)
		if !strings.Contains(msg, "Underpayment detected") {
			t.Fatalf("expected underpaid message, got: %s", msg)
		}
	})

	t.Run("overpaid", func(t *testing.T) {
		inv := Invoice{
			Kind:           InvoiceKindMerchant,
			Status:         InvoiceStatusOverpaid,
			PublicID:       "INV-004",
			PayableNetwork: NetworkSOLANA,
			PayableAmount:  expected,
		}
		msg := buildInvoiceNotificationMessage(inv, "overpaid", decimal.RequireFromString("12.000000"))
		if !strings.Contains(msg, "Overpayment") {
			t.Fatalf("expected overpaid message, got: %s", msg)
		}
	})

	t.Run("manual review", func(t *testing.T) {
		inv := Invoice{
			Kind:           InvoiceKindMerchant,
			Status:         InvoiceStatusManualReview,
			PublicID:       "INV-005",
			PayableNetwork: NetworkBASE,
			PayableAmount:  expected,
		}
		msg := buildInvoiceNotificationMessage(inv, "late_payment", amount)
		if !strings.Contains(msg, "Late payment") {
			t.Fatalf("expected manual review message, got: %s", msg)
		}
	})

	t.Run("default status", func(t *testing.T) {
		inv := Invoice{
			Kind:           InvoiceKindMerchant,
			Status:         InvoiceStatusExpired,
			PublicID:       "INV-006",
			PayableNetwork: NetworkARBITRUM,
			PayableAmount:  expected,
		}
		msg := buildInvoiceNotificationMessage(inv, "expired", amount)
		if !strings.Contains(msg, "INV-006") {
			t.Fatalf("expected default message with public id, got: %s", msg)
		}
	})
}

func TestBuildInvoiceNotificationPayload(t *testing.T) {
	t.Run("underpaid has mark_paid and keep_underpaid actions", func(t *testing.T) {
		inv := Invoice{
			ID:       42,
			PublicID: "INV-U",
			Status:   InvoiceStatusUnderpaid,
		}
		raw := buildInvoiceNotificationPayload(inv, "underpaid")
		payload := string(raw)
		if !strings.Contains(payload, "mark_paid") || !strings.Contains(payload, "keep_underpaid") {
			t.Fatalf("expected underpaid actions, got: %s", payload)
		}
	})

	t.Run("overpaid has mark_paid and keep_review actions", func(t *testing.T) {
		inv := Invoice{
			ID:       43,
			PublicID: "INV-O",
			Status:   InvoiceStatusOverpaid,
		}
		raw := buildInvoiceNotificationPayload(inv, "overpaid")
		payload := string(raw)
		if !strings.Contains(payload, "mark_paid") || !strings.Contains(payload, "keep_review") {
			t.Fatalf("expected overpaid actions, got: %s", payload)
		}
	})

	t.Run("manual review has mark_paid and keep_review actions", func(t *testing.T) {
		inv := Invoice{
			ID:       44,
			PublicID: "INV-MR",
			Status:   InvoiceStatusManualReview,
		}
		raw := buildInvoiceNotificationPayload(inv, "late_payment")
		payload := string(raw)
		if !strings.Contains(payload, "mark_paid") || !strings.Contains(payload, "keep_review") {
			t.Fatalf("expected manual review actions, got: %s", payload)
		}
	})

	t.Run("paid has no actions", func(t *testing.T) {
		inv := Invoice{
			ID:       45,
			PublicID: "INV-P",
			Status:   InvoiceStatusPaid,
		}
		raw := buildInvoiceNotificationPayload(inv, "paid_exact")
		payload := string(raw)
		if strings.Contains(payload, "invoice_actions") {
			t.Fatalf("expected no actions for paid invoice, got: %s", payload)
		}
		if !strings.Contains(payload, "INV-P") {
			t.Fatalf("expected public_id in payload, got: %s", payload)
		}
	})
}

func TestNormalizeExternalEventID(t *testing.T) {
	t.Run("uses external event id when set", func(t *testing.T) {
		transfer := ObservedTransfer{
			ExternalEventID: "evt_123",
			Network:         NetworkTON,
			TxHash:          "0xabc",
		}
		if got := normalizeExternalEventID(transfer); got != "evt_123" {
			t.Fatalf("expected evt_123, got %q", got)
		}
	})

	t.Run("uses network:txhash when external event id empty", func(t *testing.T) {
		transfer := ObservedTransfer{
			ExternalEventID: "",
			Network:         NetworkEVM,
			TxHash:          "0xdef",
		}
		if got := normalizeExternalEventID(transfer); got != "EVM:0xdef" {
			t.Fatalf("expected EVM:0xdef, got %q", got)
		}
	})

	t.Run("whitespace-only external event id falls back to network:txhash", func(t *testing.T) {
		transfer := ObservedTransfer{
			ExternalEventID: "   ",
			Network:         NetworkTRON,
			TxHash:          "tron_tx_001",
		}
		if got := normalizeExternalEventID(transfer); got != "TRON:tron_tx_001" {
			t.Fatalf("expected TRON:tron_tx_001, got %q", got)
		}
	})
}

func TestPayableScaleNetworks(t *testing.T) {
	networks := []Network{NetworkTON, NetworkTRON, NetworkSOLANA, NetworkEVM, NetworkBASE, NetworkARBITRUM, NetworkBSC}
	for _, n := range networks {
		if got := payableScale(n); got != 6 {
			t.Fatalf("payableScale(%s) = %d, want 6", n, got)
		}
	}
	// default fallback
	if got := payableScale(Network("UNKNOWN_NET")); got != 6 {
		t.Fatalf("payableScale(UNKNOWN) = %d, want 6", got)
	}
}

func TestResolvePlanAllCodes(t *testing.T) {
	cases := []PlanCode{PlanCodeTrial, PlanCodeMerchant, PlanCodeDeveloper, PlanCodeBusiness}
	for _, code := range cases {
		plan := ResolvePlan(code)
		if plan.Code == "" {
			t.Fatalf("ResolvePlan(%s) returned empty code", code)
		}
	}
	// Unknown code falls back to trial
	plan := ResolvePlan(PlanCode("nonexistent_plan"))
	if plan.Code != PlanCodeTrial {
		t.Fatalf("expected trial fallback for unknown plan, got %s", plan.Code)
	}
}

func TestNormalizePlanCodeAllCases(t *testing.T) {
	cases := map[string]PlanCode{
		"trial":         PlanCodeTrial,
		"merchant":      PlanCodeMerchant,
		"developer":     PlanCodeDeveloper,
		"business":      PlanCodeBusiness,
		"enterprise":    PlanCodeBusiness,
		"pro":           PlanCodeMerchant,  // alias
		"dev":           PlanCodeDeveloper, // alias
		"unknown":       PlanCodeTrial,     // default
		"MERCHANT":      PlanCodeMerchant,  // case-insensitive
		"  developer  ": PlanCodeDeveloper, // whitespace
	}
	for input, want := range cases {
		got := NormalizePlanCode(input)
		if got != want {
			t.Fatalf("NormalizePlanCode(%q) = %q; want %q", input, got, want)
		}
	}
}

func TestStoreNewWithInvalidDSN(t *testing.T) {
	ctx := context.Background()
	// Invalid URL that cannot be parsed as a database URL
	_, err := New(ctx, "not-a-postgres-url")
	if err == nil {
		t.Fatal("expected error for invalid DSN, got nil")
	}
}

func TestStoreNewWithUnreachableHost(t *testing.T) {
	ctx := context.Background()
	// Valid connection string format but unreachable host (port 1 is generally closed)
	_, err := New(ctx, "postgres://recv:recv@127.0.0.1:1/recv?sslmode=disable&connect_timeout=1")
	if err == nil {
		t.Fatal("expected error for unreachable host, got nil")
	}
}

func TestValidateWalletAddressAllNetworks(t *testing.T) {
	// Valid EVM
	if err := ValidateWalletAddress(NetworkEVM, "0xABCDEF1234567890ABCDEF1234567890ABCDEF12"); err != nil {
		t.Fatalf("EVM valid: %v", err)
	}
	// Invalid EVM (too short)
	if err := ValidateWalletAddress(NetworkEVM, "0x1234"); err == nil {
		t.Fatal("expected error for short EVM address")
	}
	// Valid TON
	if err := ValidateWalletAddress(NetworkTON, "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHaWqcn"); err != nil {
		t.Fatalf("TON valid: %v", err)
	}
	// Valid TRON
	if err := ValidateWalletAddress(NetworkTRON, "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9"); err != nil {
		t.Fatalf("TRON valid: %v", err)
	}
	// Valid SOLANA
	if err := ValidateWalletAddress(NetworkSOLANA, "DgTFwh8r8gGRNQyLz2jP4kCMv4rNVmtaKBuUPeRZxH4t"); err != nil {
		t.Fatalf("SOLANA valid: %v", err)
	}
}
