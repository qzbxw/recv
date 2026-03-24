package store

import (
	"strings"
	"time"

	"github.com/shopspring/decimal"
)

type PlanCode string

const (
	PlanCodeTrial      PlanCode = "trial"
	PlanCodePro        PlanCode = "pro"
	PlanCodeDev        PlanCode = "dev"
	PlanCodeEnterprise PlanCode = "enterprise"
)

type PlanDefinition struct {
	Code              PlanCode        `json:"code"`
	Name              string          `json:"name"`
	CheckoutTitle     string          `json:"checkout_title"`
	CheckoutBadge     string          `json:"checkout_badge"`
	MarketingLabel    string          `json:"marketing_label"`
	PriceUSD          decimal.Decimal `json:"-"`
	PriceUSDString    string          `json:"price_usd"`
	BillingDays       int             `json:"billing_days"`
	HasUnlimitedSales bool            `json:"has_unlimited_sales"`
	HasAPI            bool            `json:"has_api"`
	HasWebhooks       bool            `json:"has_webhooks"`
	APIKeyLimit       int             `json:"api_key_limit"`
	MonthlyRequestCap int             `json:"monthly_request_cap"`
	RequestsPerMinute int             `json:"requests_per_minute"`
	WebhookRetries    int             `json:"webhook_retries"`
	PrioritySupport   bool            `json:"priority_support"`
}

var planCatalog = map[PlanCode]PlanDefinition{
	PlanCodeTrial: {
		Code:              PlanCodeTrial,
		Name:              "Trial",
		CheckoutTitle:     "Reqst Trial",
		CheckoutBadge:     "Merchant",
		MarketingLabel:    "Reqst Trial",
		PriceUSD:          decimal.Zero,
		PriceUSDString:    "0",
		BillingDays:       0,
		HasUnlimitedSales: false,
		HasAPI:            false,
		HasWebhooks:       false,
	},
	PlanCodePro: {
		Code:              PlanCodePro,
		Name:              "Reqst PRO",
		CheckoutTitle:     "Reqst PRO · 30 days",
		CheckoutBadge:     "Reqst PRO",
		MarketingLabel:    "Reqst PRO",
		PriceUSD:          decimal.RequireFromString("39"),
		PriceUSDString:    "39",
		BillingDays:       30,
		HasUnlimitedSales: true,
	},
	PlanCodeDev: {
		Code:              PlanCodeDev,
		Name:              "Reqst Dev",
		CheckoutTitle:     "Reqst Dev · 30 days",
		CheckoutBadge:     "Reqst Dev",
		MarketingLabel:    "Reqst Dev",
		PriceUSD:          decimal.RequireFromString("149"),
		PriceUSDString:    "149",
		BillingDays:       30,
		HasUnlimitedSales: true,
		HasAPI:            true,
		HasWebhooks:       true,
		APIKeyLimit:       3,
		MonthlyRequestCap: 50000,
		RequestsPerMinute: 90,
		WebhookRetries:    3,
	},
	PlanCodeEnterprise: {
		Code:              PlanCodeEnterprise,
		Name:              "Reqst Enterprise",
		CheckoutTitle:     "Reqst Enterprise · 30 days",
		CheckoutBadge:     "Reqst Enterprise",
		MarketingLabel:    "Reqst Enterprise",
		PriceUSD:          decimal.RequireFromString("499"),
		PriceUSDString:    "499",
		BillingDays:       30,
		HasUnlimitedSales: true,
		HasAPI:            true,
		HasWebhooks:       true,
		APIKeyLimit:       20,
		MonthlyRequestCap: 500000,
		RequestsPerMinute: 600,
		WebhookRetries:    8,
		PrioritySupport:   true,
	},
}

func NormalizePlanCode(raw string) PlanCode {
	code := PlanCode(strings.ToLower(strings.TrimSpace(raw)))
	switch code {
	case PlanCodeTrial, PlanCodePro, PlanCodeDev, PlanCodeEnterprise:
		return code
	default:
		return PlanCodeTrial
	}
}

func ResolvePlan(code PlanCode) PlanDefinition {
	normalized := NormalizePlanCode(string(code))
	if plan, ok := planCatalog[normalized]; ok {
		return plan
	}
	return planCatalog[PlanCodeTrial]
}

func ListPaidPlans() []PlanDefinition {
	return []PlanDefinition{
		ResolvePlan(PlanCodePro),
		ResolvePlan(PlanCodeDev),
		ResolvePlan(PlanCodeEnterprise),
	}
}

func (s Seller) HasActiveSubscription(now time.Time) bool {
	return s.SubscriptionEndsAt != nil && s.SubscriptionEndsAt.After(now)
}

func (s Seller) EffectivePlanCode(now time.Time) PlanCode {
	if !s.HasActiveSubscription(now) {
		return PlanCodeTrial
	}
	code := NormalizePlanCode(string(s.PlanCode))
	if code == PlanCodeTrial {
		return PlanCodePro
	}
	return code
}

func (s Seller) EffectivePlan(now time.Time) PlanDefinition {
	return ResolvePlan(s.EffectivePlanCode(now))
}

func (s Seller) IsPRO(now time.Time) bool {
	return s.HasActiveSubscription(now)
}
