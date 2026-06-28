package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"recv/backend/internal/store"

	"github.com/shopspring/decimal"
)

const (
	DefaultTelegramStarsPerUSD = 50
	telegramStarsCurrency      = "XTR"
)

type StarsService struct {
	store       *store.Store
	starsPerUSD int
}

type CreateStarsPaymentInput struct {
	PlanCode         store.PlanCode
	SubscriptionDays int
}

type StarsPaymentCheckout struct {
	Payment          store.TelegramStarPayment  `json:"payment"`
	Plan             store.PlanDefinition       `json:"plan"`
	Currency         string                     `json:"currency"`
	Title            string                     `json:"title"`
	Description      string                     `json:"description"`
	PaymentMethod    store.BillingPaymentMethod `json:"payment_method"`
	TelegramBotStart string                     `json:"telegram_bot_start,omitempty"`
	InvoiceURL       string                     `json:"invoice_url,omitempty"`
}

func NewStarsService(st *store.Store, starsPerUSD int) *StarsService {
	if starsPerUSD <= 0 {
		starsPerUSD = DefaultTelegramStarsPerUSD
	}
	return &StarsService{store: st, starsPerUSD: starsPerUSD}
}

func (s *StarsService) CreatePayment(ctx context.Context, workspace store.Workspace, input CreateStarsPaymentInput) (StarsPaymentCheckout, error) {
	if workspace.IsBlocked {
		return StarsPaymentCheckout{}, errors.New("workspace is blocked")
	}
	planCode := store.NormalizePlanCode(string(input.PlanCode))
	plan := store.ResolvePlan(planCode)
	if plan.Code == store.PlanCodeTrial {
		return StarsPaymentCheckout{}, errors.New("trial does not require billing")
	}
	days := input.SubscriptionDays
	if days <= 0 {
		days = plan.BillingDays
	}
	if days < 14 {
		return StarsPaymentCheckout{}, errors.New("subscription duration must be at least 14 days")
	}
	priceUSD := PlanPriceForPeriod(workspace, plan, days)
	starsAmount := s.StarsAmountForUSD(priceUSD)
	payload, err := generateStarsPayload()
	if err != nil {
		return StarsPaymentCheckout{}, err
	}
	payment, err := s.store.CreateTelegramStarPayment(ctx, store.CreateTelegramStarPaymentParams{
		Payload:          payload,
		WorkspaceID:      workspace.ID,
		PlanCode:         plan.Code,
		SubscriptionDays: days,
		BaseAmountUSD:    priceUSD,
		StarsAmount:      starsAmount,
	})
	if err != nil {
		return StarsPaymentCheckout{}, err
	}
	return StarsPaymentCheckout{
		Payment:       payment,
		Plan:          plan,
		Currency:      telegramStarsCurrency,
		Title:         StarsInvoiceTitle(plan, days),
		Description:   StarsInvoiceDescription(plan, days),
		PaymentMethod: store.BillingPaymentMethodTelegramStars,
	}, nil
}

func (s *StarsService) ConfirmPayment(ctx context.Context, payload string, currency string, totalAmount int, telegramChargeID string, providerChargeID string, paidAt time.Time) (store.TelegramStarPayment, error) {
	if strings.ToUpper(strings.TrimSpace(currency)) != telegramStarsCurrency {
		return store.TelegramStarPayment{}, fmt.Errorf("unsupported telegram payment currency %s", currency)
	}
	payment, err := s.store.GetTelegramStarPaymentByPayload(ctx, payload)
	if err != nil {
		return store.TelegramStarPayment{}, err
	}
	if payment.StarsAmount != totalAmount {
		return store.TelegramStarPayment{}, fmt.Errorf("telegram stars amount mismatch: expected %d, got %d", payment.StarsAmount, totalAmount)
	}
	return s.store.CompleteTelegramStarPayment(ctx, store.CompleteTelegramStarPaymentParams{
		Payload:                 payload,
		TelegramPaymentChargeID: telegramChargeID,
		ProviderPaymentChargeID: providerChargeID,
		PaidAt:                  paidAt,
	})
}

func (s *StarsService) StarsAmountForUSD(amount decimal.Decimal) int {
	value := amount.Mul(decimal.NewFromInt(int64(s.starsPerUSD))).Ceil()
	if value.LessThan(decimal.NewFromInt(1)) {
		return 1
	}
	if !value.LessThanOrEqual(decimal.NewFromInt(math.MaxInt32)) {
		return math.MaxInt32
	}
	return int(value.IntPart())
}

func PlanPriceForPeriod(workspace store.Workspace, plan store.PlanDefinition, days int) decimal.Decimal {
	if days <= 0 {
		days = plan.BillingDays
	}
	baseAmountUSD := plan.PriceUSD
	if days > 0 && plan.BillingDays > 0 && days != plan.BillingDays {
		baseAmountUSD = plan.PriceUSD.Mul(decimal.NewFromInt(int64(days))).Div(decimal.NewFromInt(int64(plan.BillingDays))).Round(2)
	}
	if workspace.DiscountPercent > 0 && (workspace.DiscountPlanCode == nil || *workspace.DiscountPlanCode == "" || store.PlanCode(*workspace.DiscountPlanCode) == plan.Code) {
		discountMultiplier := decimal.NewFromInt(100 - int64(workspace.DiscountPercent)).Div(decimal.NewFromInt(100))
		baseAmountUSD = baseAmountUSD.Mul(discountMultiplier).Round(2)
	}
	return baseAmountUSD
}

func StarsInvoiceTitle(plan store.PlanDefinition, days int) string {
	return fmt.Sprintf("recv %s", plan.Name)
}

func StarsInvoiceDescription(plan store.PlanDefinition, days int) string {
	return fmt.Sprintf("%d days of recv %s access", days, plan.Name)
}

func generateStarsPayload() (string, error) {
	var raw [16]byte
	if _, err := rand.Read(raw[:]); err != nil {
		return "", fmt.Errorf("generate telegram stars payload: %w", err)
	}
	return "stars_" + hex.EncodeToString(raw[:]), nil
}
