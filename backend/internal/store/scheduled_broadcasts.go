package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

var (
	ErrScheduledBroadcastNotFound   = errors.New("scheduled broadcast not found")
	ErrScheduledBroadcastNotPending = errors.New("scheduled broadcast is not in pending status")
)

func (s *Store) CreateScheduledBroadcast(ctx context.Context, message string, scheduledAt time.Time) (ScheduledBroadcast, error) {
	var b ScheduledBroadcast
	err := s.pool.QueryRow(ctx, `
		INSERT INTO scheduled_broadcasts (message, scheduled_at, status)
		VALUES ($1, $2, 'pending')
		RETURNING id, message, scheduled_at, status, created_at, updated_at, sent_at
	`, message, scheduledAt).Scan(&b.ID, &b.Message, &b.ScheduledAt, &b.Status, &b.CreatedAt, &b.UpdatedAt, &b.SentAt)
	if err != nil {
		return b, fmt.Errorf("create scheduled broadcast: %w", err)
	}
	return b, nil
}

func (s *Store) ListScheduledBroadcasts(ctx context.Context) ([]ScheduledBroadcast, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, message, scheduled_at, status, created_at, updated_at, sent_at
		FROM scheduled_broadcasts
		ORDER BY scheduled_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("list scheduled broadcasts: %w", err)
	}
	defer rows.Close()

	list := []ScheduledBroadcast{}
	for rows.Next() {
		var b ScheduledBroadcast
		err := rows.Scan(&b.ID, &b.Message, &b.ScheduledAt, &b.Status, &b.CreatedAt, &b.UpdatedAt, &b.SentAt)
		if err != nil {
			return nil, fmt.Errorf("scan scheduled broadcast: %w", err)
		}
		list = append(list, b)
	}
	return list, rows.Err()
}

func (s *Store) UpdateScheduledBroadcast(ctx context.Context, id int64, message string, scheduledAt time.Time) (ScheduledBroadcast, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return ScheduledBroadcast{}, err
	}
	defer tx.Rollback(ctx)

	var status string
	err = tx.QueryRow(ctx, `
		SELECT status FROM scheduled_broadcasts WHERE id = $1 FOR UPDATE
	`, id).Scan(&status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ScheduledBroadcast{}, ErrScheduledBroadcastNotFound
		}
		return ScheduledBroadcast{}, fmt.Errorf("query scheduled broadcast status: %w", err)
	}

	if status != "pending" {
		return ScheduledBroadcast{}, ErrScheduledBroadcastNotPending
	}

	var b ScheduledBroadcast
	err = tx.QueryRow(ctx, `
		UPDATE scheduled_broadcasts
		SET message = $1, scheduled_at = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING id, message, scheduled_at, status, created_at, updated_at, sent_at
	`, message, scheduledAt, id).Scan(&b.ID, &b.Message, &b.ScheduledAt, &b.Status, &b.CreatedAt, &b.UpdatedAt, &b.SentAt)
	if err != nil {
		return b, fmt.Errorf("update scheduled broadcast: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return ScheduledBroadcast{}, fmt.Errorf("commit update scheduled broadcast tx: %w", err)
	}

	return b, nil
}

func (s *Store) DeleteScheduledBroadcast(ctx context.Context, id int64) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var status string
	err = tx.QueryRow(ctx, `
		SELECT status FROM scheduled_broadcasts WHERE id = $1 FOR UPDATE
	`, id).Scan(&status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrScheduledBroadcastNotFound
		}
		return fmt.Errorf("query scheduled broadcast status for delete: %w", err)
	}

	if status != "pending" {
		return ErrScheduledBroadcastNotPending
	}

	_, err = tx.Exec(ctx, `
		DELETE FROM scheduled_broadcasts
		WHERE id = $1
	`, id)
	if err != nil {
		return fmt.Errorf("delete scheduled broadcast: %w", err)
	}

	return tx.Commit(ctx)
}

func (s *Store) GetPendingScheduledBroadcasts(ctx context.Context) ([]ScheduledBroadcast, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, message, scheduled_at, status, created_at, updated_at, sent_at
		FROM scheduled_broadcasts
		WHERE status = 'pending' AND scheduled_at <= NOW()
		ORDER BY scheduled_at ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("query pending scheduled broadcasts: %w", err)
	}
	defer rows.Close()

	list := []ScheduledBroadcast{}
	for rows.Next() {
		var b ScheduledBroadcast
		err := rows.Scan(&b.ID, &b.Message, &b.ScheduledAt, &b.Status, &b.CreatedAt, &b.UpdatedAt, &b.SentAt)
		if err != nil {
			return nil, fmt.Errorf("scan pending scheduled broadcast: %w", err)
		}
		list = append(list, b)
	}
	return list, rows.Err()
}

func (s *Store) ProcessScheduledBroadcast(ctx context.Context, id int64) (int64, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var message string
	var status string
	err = tx.QueryRow(ctx, `
		SELECT message, status
		FROM scheduled_broadcasts
		WHERE id = $1 FOR UPDATE
	`, id).Scan(&message, &status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, ErrScheduledBroadcastNotFound
		}
		return 0, fmt.Errorf("lock scheduled broadcast: %w", err)
	}

	if status != "pending" {
		return 0, nil // already processed
	}

	_, err = tx.Exec(ctx, `
		UPDATE scheduled_broadcasts
		SET status = 'sent', sent_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`, id)
	if err != nil {
		return 0, fmt.Errorf("mark scheduled broadcast sent: %w", err)
	}

	tag, err := tx.Exec(ctx, `
		INSERT INTO notification_outbox (workspace_id, recipient_telegram_id, message)
		SELECT id, owner_telegram_id, $1
		FROM workspaces
		WHERE owner_telegram_id IS NOT NULL
		  AND is_blocked = FALSE
		  AND bot_blocked = FALSE
	`, message)
	if err != nil {
		return 0, fmt.Errorf("queue notification_outbox for scheduled broadcast: %w", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return 0, fmt.Errorf("commit scheduled broadcast tx: %w", err)
	}

	return tag.RowsAffected(), nil
}
