package store

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type SystemConfig struct {
	Key       string          `json:"key"`
	Value     json.RawMessage `json:"value,omitempty"`
	IsSecret  bool            `json:"is_secret"`
	UpdatedBy string          `json:"updated_by,omitempty"`
	UpdatedAt time.Time       `json:"updated_at"`
}

func (s *Store) GetSystemConfig(ctx context.Context, key string) (SystemConfig, error) {
	var item SystemConfig
	row := s.pool.QueryRow(ctx, `
		SELECT key, value, is_secret, COALESCE(updated_by, ''), updated_at
		FROM system_config
		WHERE key = $1
	`, strings.TrimSpace(key))
	if err := row.Scan(&item.Key, &item.Value, &item.IsSecret, &item.UpdatedBy, &item.UpdatedAt); err != nil {
		return SystemConfig{}, scanConfigError(err)
	}
	return item, nil
}

func (s *Store) UpsertSystemConfig(ctx context.Context, key string, value any, isSecret bool, updatedBy string) error {
	raw := MustJSON(value)
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin system config tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var oldValue json.RawMessage
	_ = tx.QueryRow(ctx, `SELECT value FROM system_config WHERE key = $1 FOR UPDATE`, strings.TrimSpace(key)).Scan(&oldValue)
	if _, err := tx.Exec(ctx, `
		INSERT INTO system_config (key, value, is_secret, updated_by, updated_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (key)
		DO UPDATE SET value = EXCLUDED.value, is_secret = EXCLUDED.is_secret, updated_by = EXCLUDED.updated_by, updated_at = NOW()
	`, strings.TrimSpace(key), raw, isSecret, updatedBy); err != nil {
		return fmt.Errorf("upsert system config: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO system_config_audit (key, old_value, new_value, updated_by)
		VALUES ($1, $2, $3, $4)
	`, strings.TrimSpace(key), oldValue, raw, updatedBy); err != nil {
		return fmt.Errorf("audit system config: %w", err)
	}
	return tx.Commit(ctx)
}

func (s *Store) GetBillingWalletAddress(ctx context.Context, network Network) (string, error) {
	item, err := s.GetSystemConfig(ctx, "billing_wallets")
	if err != nil {
		return "", err
	}
	var wallets map[string]string
	if err := json.Unmarshal(item.Value, &wallets); err != nil {
		return "", fmt.Errorf("decode billing wallets config: %w", err)
	}
	address := strings.TrimSpace(wallets[string(network.WalletBucket())])
	if address == "" {
		address = strings.TrimSpace(wallets[string(network)])
	}
	if address == "" {
		return "", ErrNotFound
	}
	return address, nil
}

func (s *Store) AllowRateLimit(ctx context.Context, key string, limit int, window time.Duration) (int, bool, error) {
	if limit <= 0 {
		return 0, true, nil
	}
	if window <= 0 {
		window = time.Minute
	}
	now := time.Now().UTC()
	windowSeconds := int(window.Seconds())
	windowStart := now.Truncate(window)

	var count int
	err := s.pool.QueryRow(ctx, `
		INSERT INTO rate_limit_buckets (key, window_start, window_seconds, count, updated_at)
		VALUES ($1, $2, $3, 1, NOW())
		ON CONFLICT (key)
		DO UPDATE SET
			window_start = CASE
				WHEN rate_limit_buckets.window_start <> EXCLUDED.window_start
				  OR rate_limit_buckets.window_seconds <> EXCLUDED.window_seconds
				THEN EXCLUDED.window_start ELSE rate_limit_buckets.window_start END,
			window_seconds = EXCLUDED.window_seconds,
			count = CASE
				WHEN rate_limit_buckets.window_start <> EXCLUDED.window_start
				  OR rate_limit_buckets.window_seconds <> EXCLUDED.window_seconds
				THEN 1 ELSE rate_limit_buckets.count + 1 END,
			updated_at = NOW()
		RETURNING count
	`, strings.TrimSpace(key), windowStart, windowSeconds).Scan(&count)
	if err != nil {
		return 0, false, fmt.Errorf("allow rate limit: %w", err)
	}
	remaining := limit - count
	return remaining, count <= limit, nil
}

func (s *Store) RecordAdminAuditEvent(ctx context.Context, actor string, action string, targetType string, targetID string, metadata any) error {
	if _, err := s.pool.Exec(ctx, `
		INSERT INTO admin_audit_events (actor, action, target_type, target_id, metadata)
		VALUES ($1, $2, $3, $4, $5)
	`, actor, action, targetType, targetID, MustJSON(metadata)); err != nil {
		return fmt.Errorf("record admin audit event: %w", err)
	}
	return nil
}

type AdminAuditEvent struct {
	ID         int64           `json:"id"`
	Actor      string          `json:"actor"`
	Action     string          `json:"action"`
	TargetType string          `json:"target_type"`
	TargetID   string          `json:"target_id"`
	Metadata   json.RawMessage `json:"metadata"`
	CreatedAt  time.Time       `json:"created_at"`
}

func (s *Store) ListAdminAuditEvents(ctx context.Context, limit int) ([]AdminAuditEvent, error) {
	if limit <= 0 || limit > 200 {
		limit = 100
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id, COALESCE(actor, ''), COALESCE(action, ''), COALESCE(target_type, ''), COALESCE(target_id, ''), metadata, created_at
		FROM admin_audit_events
		ORDER BY created_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, fmt.Errorf("list admin audit events: %w", err)
	}
	defer rows.Close()

	items := make([]AdminAuditEvent, 0, limit)
	for rows.Next() {
		var item AdminAuditEvent
		if err := rows.Scan(&item.ID, &item.Actor, &item.Action, &item.TargetType, &item.TargetID, &item.Metadata, &item.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan admin audit event: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func scanConfigError(err error) error {
	if err == nil {
		return nil
	}
	if err == pgx.ErrNoRows {
		return ErrNotFound
	}
	return fmt.Errorf("scan system config: %w", err)
}
