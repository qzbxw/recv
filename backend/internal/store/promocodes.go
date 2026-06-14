package store

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"recv/backend/internal/metrics"
)

var (
	ErrPromoCodeNotFound     = errors.New("promo code not found")
	ErrPromoCodeExpired      = errors.New("promo code is expired")
	ErrPromoCodeMaxUsesLimit = errors.New("promo code has reached its max uses limit")
	ErrPromoCodeAlreadyUsed  = errors.New("promo code has already been redeemed by this workspace")
)

func (s *Store) CreatePromoCode(ctx context.Context, code string, durationDays int, planCode PlanCode, expiresAt *time.Time, maxUses *int, createdBy string) (PromoCode, error) {
	code = strings.ToUpper(strings.TrimSpace(code))
	if code == "" {
		return PromoCode{}, errors.New("promo code cannot be empty")
	}
	if durationDays <= 0 {
		return PromoCode{}, errors.New("duration days must be greater than zero")
	}
	if planCode == "" {
		planCode = PlanCodeMerchant
	}

	var promo PromoCode
	err := s.pool.QueryRow(ctx, `
		INSERT INTO promo_codes (code, duration_days, plan_code, expires_at, max_uses, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, code, duration_days, plan_code, expires_at, max_uses, uses_count, created_by, created_at
	`, code, durationDays, planCode, expiresAt, maxUses, createdBy).Scan(
		&promo.ID, &promo.Code, &promo.DurationDays, &promo.PlanCode, &promo.ExpiresAt, &promo.MaxUses, &promo.UsesCount, &promo.CreatedBy, &promo.CreatedAt,
	)
	if err != nil {
		return PromoCode{}, fmt.Errorf("create promo code: %w", err)
	}

	metrics.IncResourceOperation("promo_code", "create", "success")
	return promo, nil
}

func (s *Store) ListPromoCodes(ctx context.Context) ([]PromoCode, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, code, duration_days, plan_code, expires_at, max_uses, uses_count, created_by, created_at
		FROM promo_codes
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("list promo codes: %w", err)
	}
	defer rows.Close()

	var promos []PromoCode
	for rows.Next() {
		var promo PromoCode
		if err := rows.Scan(&promo.ID, &promo.Code, &promo.DurationDays, &promo.PlanCode, &promo.ExpiresAt, &promo.MaxUses, &promo.UsesCount, &promo.CreatedBy, &promo.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan promo code: %w", err)
		}
		promos = append(promos, promo)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return promos, nil
}

func (s *Store) DeletePromoCode(ctx context.Context, id int64) error {
	res, err := s.pool.Exec(ctx, `
		DELETE FROM promo_codes WHERE id = $1
	`, id)
	if err != nil {
		return fmt.Errorf("delete promo code: %w", err)
	}
	if res.RowsAffected() == 0 {
		return ErrNotFound
	}
	metrics.IncResourceOperation("promo_code", "delete", "success")
	return nil
}

func (s *Store) RedeemPromoCode(ctx context.Context, workspaceID int64, code string) (Workspace, error) {
	code = strings.ToUpper(strings.TrimSpace(code))
	if code == "" {
		return Workspace{}, errors.New("promo code cannot be empty")
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Workspace{}, fmt.Errorf("begin redeem tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Fetch promo code and lock it
	var promo PromoCode
	err = tx.QueryRow(ctx, `
		SELECT id, code, duration_days, plan_code, expires_at, max_uses, uses_count
		FROM promo_codes
		WHERE code = $1
		FOR UPDATE
	`, code).Scan(&promo.ID, &promo.Code, &promo.DurationDays, &promo.PlanCode, &promo.ExpiresAt, &promo.MaxUses, &promo.UsesCount)
	if errors.Is(err, pgx.ErrNoRows) {
		return Workspace{}, ErrPromoCodeNotFound
	}
	if err != nil {
		return Workspace{}, fmt.Errorf("fetch promo code for redemption: %w", err)
	}

	// Check expiry
	if promo.ExpiresAt != nil && promo.ExpiresAt.Before(time.Now()) {
		return Workspace{}, ErrPromoCodeExpired
	}

	// Check max uses
	if promo.MaxUses != nil && promo.UsesCount >= *promo.MaxUses {
		return Workspace{}, ErrPromoCodeMaxUsesLimit
	}

	// Check if already used by this workspace
	var exists bool
	err = tx.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM promo_code_redemptions
			WHERE promo_code_id = $1 AND workspace_id = $2
		)
	`, promo.ID, workspaceID).Scan(&exists)
	if err != nil {
		return Workspace{}, fmt.Errorf("check redemption exists: %w", err)
	}
	if exists {
		return Workspace{}, ErrPromoCodeAlreadyUsed
	}

	// Log redemption
	if _, err := tx.Exec(ctx, `
		INSERT INTO promo_code_redemptions (promo_code_id, workspace_id)
		VALUES ($1, $2)
	`, promo.ID, workspaceID); err != nil {
		return Workspace{}, fmt.Errorf("insert redemption log: %w", err)
	}

	// Update uses count
	if _, err := tx.Exec(ctx, `
		UPDATE promo_codes
		SET uses_count = uses_count + 1
		WHERE id = $1
	`, promo.ID); err != nil {
		return Workspace{}, fmt.Errorf("increment uses count: %w", err)
	}

	// Upgrade plan and extend subscription
	row := tx.QueryRow(ctx, `
		UPDATE workspaces
		SET plan_code = $2,
		    subscription_ends_at = GREATEST(COALESCE(subscription_ends_at, NOW()), NOW()) + make_interval(days => $3)
		WHERE id = $1
		RETURNING `+workspaceSelectColumns+`
	`, workspaceID, promo.PlanCode, promo.DurationDays)

	workspace, err := scanWorkspace(row)
	if err != nil {
		return Workspace{}, fmt.Errorf("update workspace plan/subscription: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return Workspace{}, fmt.Errorf("commit redeem tx: %w", err)
	}

	metrics.IncResourceOperation("promo_code", "redeem", "success")
	return workspace, nil
}
