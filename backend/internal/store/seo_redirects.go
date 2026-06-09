package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type SEORedirect struct {
	ID         int64     `json:"id"`
	SourcePath string    `json:"source_path"`
	TargetURL  string    `json:"target_url"`
	StatusCode int       `json:"status_code"`
	IsActive   bool      `json:"is_active"`
	CreatedBy  string    `json:"created_by"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

const seoRedirectColumns = `
	id, source_path, target_url, status_code, is_active,
	COALESCE(created_by, ''), created_at, updated_at
`

func scanSEORedirect(row pgx.Row) (SEORedirect, error) {
	var redirect SEORedirect
	err := row.Scan(
		&redirect.ID,
		&redirect.SourcePath,
		&redirect.TargetURL,
		&redirect.StatusCode,
		&redirect.IsActive,
		&redirect.CreatedBy,
		&redirect.CreatedAt,
		&redirect.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return SEORedirect{}, ErrNotFound
	}
	if err != nil {
		return SEORedirect{}, fmt.Errorf("scan seo redirect: %w", err)
	}
	return redirect, nil
}

func (s *Store) ListSEORedirects(ctx context.Context) ([]SEORedirect, error) {
	rows, err := s.pool.Query(ctx, `SELECT `+seoRedirectColumns+` FROM seo_redirects ORDER BY source_path`)
	if err != nil {
		return nil, fmt.Errorf("list seo redirects: %w", err)
	}
	defer rows.Close()

	redirects := []SEORedirect{}
	for rows.Next() {
		redirect, err := scanSEORedirect(rows)
		if err != nil {
			return nil, err
		}
		redirects = append(redirects, redirect)
	}
	return redirects, rows.Err()
}

func (s *Store) CreateSEORedirect(ctx context.Context, redirect SEORedirect) (SEORedirect, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO seo_redirects (source_path, target_url, status_code, is_active, created_by)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING `+seoRedirectColumns,
		redirect.SourcePath, redirect.TargetURL, redirect.StatusCode, redirect.IsActive, redirect.CreatedBy,
	)
	return scanSEORedirect(row)
}

func (s *Store) UpdateSEORedirect(ctx context.Context, id int64, redirect SEORedirect) (SEORedirect, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE seo_redirects
		SET source_path = $1, target_url = $2, status_code = $3,
		    is_active = $4, updated_at = NOW()
		WHERE id = $5
		RETURNING `+seoRedirectColumns,
		redirect.SourcePath, redirect.TargetURL, redirect.StatusCode, redirect.IsActive, id,
	)
	return scanSEORedirect(row)
}

func (s *Store) DeleteSEORedirect(ctx context.Context, id int64) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM seo_redirects WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete seo redirect: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) ResolveSEORedirect(ctx context.Context, sourcePath string) (SEORedirect, error) {
	return scanSEORedirect(s.pool.QueryRow(ctx, `
		SELECT `+seoRedirectColumns+`
		FROM seo_redirects
		WHERE source_path = $1 AND is_active = TRUE
	`, sourcePath))
}
