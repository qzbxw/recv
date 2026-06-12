package http

import (
	"strings"
	"testing"
	"time"

	"github.com/shopspring/decimal"
)

func TestNormalizeReferralCode(t *testing.T) {
	valid := map[string]string{
		" TG_Ivan ":  "tg_ivan",
		"shop-dev1":  "shop-dev1",
		"abc":        "abc",
		"":           "",
		strings.Repeat("a", 40): strings.Repeat("a", 40),
	}
	for input, want := range valid {
		got, err := normalizeReferralCode(input)
		if err != nil {
			t.Fatalf("normalizeReferralCode(%q) returned error: %v", input, err)
		}
		if got != want {
			t.Fatalf("normalizeReferralCode(%q) = %q, want %q", input, got, want)
		}
	}

	for _, input := range []string{"ab", "-leading", "has space", "юникод", "semi;colon", strings.Repeat("a", 41)} {
		if _, err := normalizeReferralCode(input); err == nil {
			t.Fatalf("expected %q to be rejected", input)
		}
	}
}

func TestGenerateReferralCodeIsValidAndDerivedFromName(t *testing.T) {
	code := generateReferralCode("Ivan's Telegram Shops!")
	if !strings.HasPrefix(code, "ivans-telegram-shops-") {
		t.Fatalf("unexpected generated code %q", code)
	}
	if _, err := normalizeReferralCode(code); err != nil {
		t.Fatalf("generated code %q failed validation: %v", code, err)
	}

	fallback := generateReferralCode("@@@")
	if !strings.HasPrefix(fallback, "partner-") {
		t.Fatalf("expected fallback code, got %q", fallback)
	}
}

func TestNormalizeReferralPartnerPayload(t *testing.T) {
	input, err := normalizeReferralPartnerPayload(referralPartnerPayload{
		Name:                " Ivan ",
		Contact:             "@ivan",
		CommissionPct:       "25",
		LaunchCommissionPct: "40",
		LaunchMonths:        3,
	}, true)
	if err != nil {
		t.Fatalf("normalizeReferralPartnerPayload returned error: %v", err)
	}
	if input.Name != "Ivan" || input.Code == "" {
		t.Fatalf("unexpected input: %+v", input)
	}
	if input.LaunchCommissionPct == nil || !input.LaunchCommissionPct.Equal(decimal.NewFromInt(40)) {
		t.Fatalf("expected launch pct 40, got %+v", input.LaunchCommissionPct)
	}
	if input.LaunchEndsAt == nil || input.LaunchEndsAt.Before(time.Now().Add(80*24*time.Hour)) {
		t.Fatalf("expected launch window of ~3 months, got %+v", input.LaunchEndsAt)
	}

	if _, err := normalizeReferralPartnerPayload(referralPartnerPayload{Name: ""}, true); err == nil {
		t.Fatal("expected missing name to fail")
	}
	if _, err := normalizeReferralPartnerPayload(referralPartnerPayload{Name: "x", CommissionPct: "150"}, true); err == nil {
		t.Fatal("expected commission > 100 to fail")
	}
	if _, err := normalizeReferralPartnerPayload(referralPartnerPayload{Name: "x", LaunchCommissionPct: "40"}, true); err == nil {
		t.Fatal("expected launch pct without window to fail")
	}
	if _, err := normalizeReferralPartnerPayload(referralPartnerPayload{Name: "x", Code: "bad code"}, true); err == nil {
		t.Fatal("expected invalid code to fail")
	}

	// Update path keeps an empty code instead of generating one.
	updated, err := normalizeReferralPartnerPayload(referralPartnerPayload{Name: "x"}, false)
	if err != nil {
		t.Fatalf("update payload returned error: %v", err)
	}
	if updated.Code != "" {
		t.Fatalf("expected empty code on update, got %q", updated.Code)
	}
	if !updated.CommissionPct.Equal(decimal.NewFromInt(25)) {
		t.Fatalf("expected default commission 25, got %s", updated.CommissionPct)
	}
}
