package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/shopspring/decimal"
)

type CreateTelegramStarPaymentParams struct {
	Payload          string
	WorkspaceID      int64
	PlanCode         PlanCode
	SubscriptionDays int
	BaseAmountUSD    decimal.Decimal
	StarsAmount      int
}

type CompleteTelegramStarPaymentParams struct {
	Payload                 string
	TelegramPaymentChargeID string
	ProviderPaymentChargeID string
	PaidAt                  time.Time
}

func (s *Store) CreateTelegramStarPayment(ctx context.Context, params CreateTelegramStarPaymentParams) (TelegramStarPayment, error) {
	if params.Payload == "" {
		return TelegramStarPayment{}, errors.New("payload is required")
	}
	if params.WorkspaceID <= 0 {
		return TelegramStarPayment{}, errors.New("workspace_id is required")
	}
	if params.SubscriptionDays <= 0 {
		return TelegramStarPayment{}, errors.New("subscription_days must be positive")
	}
	if !params.BaseAmountUSD.IsPositive() {
		return TelegramStarPayment{}, errors.New("base_amount_usd must be positive")
	}
	if params.StarsAmount <= 0 {
		return TelegramStarPayment{}, errors.New("stars_amount must be positive")
	}
	params.PlanCode = NormalizePlanCode(string(params.PlanCode))
	if params.PlanCode == PlanCodeTrial {
		return TelegramStarPayment{}, errors.New("trial does not require billing")
	}

	row := s.pool.QueryRow(ctx, `
		INSERT INTO telegram_star_payments (
			payload,
			workspace_id,
			plan_code,
			subscription_days,
			base_amount_usd,
			stars_amount
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, payload, workspace_id, plan_code, subscription_days, base_amount_usd, stars_amount, status,
		          COALESCE(telegram_payment_charge_id, ''), COALESCE(provider_payment_charge_id, ''), paid_at, created_at, updated_at
	`, params.Payload, params.WorkspaceID, params.PlanCode, params.SubscriptionDays, params.BaseAmountUSD, params.StarsAmount)
	return scanTelegramStarPayment(row)
}

func (s *Store) GetTelegramStarPaymentByPayload(ctx context.Context, payload string) (TelegramStarPayment, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, payload, workspace_id, plan_code, subscription_days, base_amount_usd, stars_amount, status,
		       COALESCE(telegram_payment_charge_id, ''), COALESCE(provider_payment_charge_id, ''), paid_at, created_at, updated_at
		FROM telegram_star_payments
		WHERE payload = $1
	`, payload)
	return scanTelegramStarPayment(row)
}

func (s *Store) CompleteTelegramStarPayment(ctx context.Context, params CompleteTelegramStarPaymentParams) (TelegramStarPayment, error) {
	if params.Payload == "" {
		return TelegramStarPayment{}, errors.New("payload is required")
	}
	if params.TelegramPaymentChargeID == "" {
		return TelegramStarPayment{}, errors.New("telegram_payment_charge_id is required")
	}
	if params.PaidAt.IsZero() {
		params.PaidAt = time.Now().UTC()
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return TelegramStarPayment{}, fmt.Errorf("begin telegram stars completion tx: %w", err)
	}
	defer tx.Rollback(ctx)

	row := tx.QueryRow(ctx, `
		SELECT id, payload, workspace_id, plan_code, subscription_days, base_amount_usd, stars_amount, status,
		       COALESCE(telegram_payment_charge_id, ''), COALESCE(provider_payment_charge_id, ''), paid_at, created_at, updated_at
		FROM telegram_star_payments
		WHERE payload = $1
		FOR UPDATE
	`, params.Payload)
	payment, err := scanTelegramStarPayment(row)
	if err != nil {
		return TelegramStarPayment{}, err
	}
	if payment.Status == "paid" {
		if payment.TelegramPaymentChargeID != "" && payment.TelegramPaymentChargeID != params.TelegramPaymentChargeID {
			return TelegramStarPayment{}, errors.New("telegram stars payment payload already completed with another charge")
		}
		if err := tx.Commit(ctx); err != nil {
			return TelegramStarPayment{}, fmt.Errorf("commit telegram stars completion: %w", err)
		}
		return payment, nil
	}

	row = tx.QueryRow(ctx, `
		UPDATE telegram_star_payments
		SET status = 'paid',
		    telegram_payment_charge_id = $2,
		    provider_payment_charge_id = NULLIF($3, ''),
		    paid_at = $4,
		    updated_at = NOW()
		WHERE id = $1
		RETURNING id, payload, workspace_id, plan_code, subscription_days, base_amount_usd, stars_amount, status,
		          COALESCE(telegram_payment_charge_id, ''), COALESCE(provider_payment_charge_id, ''), paid_at, created_at, updated_at
	`, payment.ID, params.TelegramPaymentChargeID, params.ProviderPaymentChargeID, params.PaidAt)
	payment, err = scanTelegramStarPayment(row)
	if err != nil {
		return TelegramStarPayment{}, err
	}

	if err := extendWorkspaceSubscriptionTx(ctx, tx, payment.WorkspaceID, payment.PlanCode, payment.SubscriptionDays); err != nil {
		return TelegramStarPayment{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return TelegramStarPayment{}, fmt.Errorf("commit telegram stars completion: %w", err)
	}
	return payment, nil
}

func scanTelegramStarPayment(row interface{ Scan(dest ...any) error }) (TelegramStarPayment, error) {
	var payment TelegramStarPayment
	err := row.Scan(
		&payment.ID,
		&payment.Payload,
		&payment.WorkspaceID,
		&payment.PlanCode,
		&payment.SubscriptionDays,
		&payment.BaseAmountUSD,
		&payment.StarsAmount,
		&payment.Status,
		&payment.TelegramPaymentChargeID,
		&payment.ProviderPaymentChargeID,
		&payment.PaidAt,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return TelegramStarPayment{}, ErrNotFound
	}
	return payment, err
}
