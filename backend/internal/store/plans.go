package store

import (
	"strings"

	"github.com/shopspring/decimal"
)

type PlanCode string

const (
	PlanCodeTrial     PlanCode = "trial"
	PlanCodeMerchant  PlanCode = "merchant"
	PlanCodeDeveloper PlanCode = "developer"
	PlanCodeBusiness  PlanCode = "business"
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
	WebhookLimit      int             `json:"webhook_limit"`
	MaxWorkspaces     int             `json:"max_workspaces"`
	MaxSeats          int             `json:"max_seats"`
	AnalyticsLevel    string          `json:"analytics_level"`
	SupportLevel      string          `json:"support_level"`
	PrioritySupport   bool            `json:"priority_support"`
}

var planCatalog = map[PlanCode]PlanDefinition{
	PlanCodeTrial: {
		Code:              PlanCodeTrial,
		Name:              "Trial",
		CheckoutTitle:     "recv Trial",
		CheckoutBadge:     "Test-only",
		MarketingLabel:    "recv Trial",
		PriceUSD:          decimal.Zero,
		PriceUSDString:    "0",
		BillingDays:       0,
		HasUnlimitedSales: false,
		HasAPI:            false,
		HasWebhooks:       true,
		MonthlyRequestCap: 0,
		RequestsPerMinute: 0,
		WebhookRetries:    3,
		WebhookLimit:      1,
		MaxWorkspaces:     1,
		MaxSeats:          1,
		AnalyticsLevel:    "none",
		SupportLevel:      "community",
	},
	PlanCodeMerchant: {
		Code:              PlanCodeMerchant,
		Name:              "Merchant",
		CheckoutTitle:     "recv Merchant · 30 days",
		CheckoutBadge:     "Merchant",
		MarketingLabel:    "Merchant",
		PriceUSD:          decimal.RequireFromString("9"),
		PriceUSDString:    "9",
		BillingDays:       30,
		HasUnlimitedSales: true,
		HasAPI:            false,
		HasWebhooks:       false,
		MonthlyRequestCap: 1000,
		RequestsPerMinute: 30,
		MaxWorkspaces:     1,
		MaxSeats:          1,
		AnalyticsLevel:    "basic",
		SupportLevel:      "standard",
	},
	PlanCodeDeveloper: {
		Code:              PlanCodeDeveloper,
		Name:              "Developer",
		CheckoutTitle:     "recv Developer · 30 days",
		CheckoutBadge:     "Developer",
		MarketingLabel:    "Developer",
		PriceUSD:          decimal.RequireFromString("29"),
		PriceUSDString:    "29",
		BillingDays:       30,
		HasUnlimitedSales: true,
		HasAPI:            true,
		HasWebhooks:       true,
		APIKeyLimit:       3,
		MonthlyRequestCap: 50000,
		RequestsPerMinute: 90,
		WebhookRetries:    3,
		WebhookLimit:      3,
		MaxWorkspaces:     3,
		MaxSeats:          3,
		AnalyticsLevel:    "basic",
		SupportLevel:      "standard",
	},
	PlanCodeBusiness: {
		Code:              PlanCodeBusiness,
		Name:              "Business",
		CheckoutTitle:     "recv Business · 30 days",
		CheckoutBadge:     "Business",
		MarketingLabel:    "Business",
		PriceUSD:          decimal.RequireFromString("79"),
		PriceUSDString:    "79",
		BillingDays:       30,
		HasUnlimitedSales: true,
		HasAPI:            true,
		HasWebhooks:       true,
		APIKeyLimit:       10,
		MonthlyRequestCap: 200000,
		RequestsPerMinute: 300,
		WebhookRetries:    5,
		WebhookLimit:      10,
		MaxWorkspaces:     10,
		MaxSeats:          10,
		AnalyticsLevel:    "advanced",
		SupportLevel:      "priority",
		PrioritySupport:   true,
	},
}

func NormalizePlanCode(raw string) PlanCode {
	code := PlanCode(strings.ToLower(strings.TrimSpace(raw)))
	switch code {
	case PlanCodeTrial, PlanCodeMerchant, PlanCodeDeveloper, PlanCodeBusiness:
		return code
	case "enterprise":
		return PlanCodeBusiness
	case "pro":
		return PlanCodeMerchant
	case "dev":
		return PlanCodeDeveloper
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
		ResolvePlan(PlanCodeMerchant),
		ResolvePlan(PlanCodeDeveloper),
		ResolvePlan(PlanCodeBusiness),
	}
}
