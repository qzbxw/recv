package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type Media struct {
	ID           int64     `json:"id"`
	FileName     string    `json:"file_name"`
	OriginalName string    `json:"original_name"`
	MimeType     string    `json:"mime_type"`
	ByteSize     int64     `json:"byte_size"`
	Width        int       `json:"width"`
	Height       int       `json:"height"`
	AltText      string    `json:"alt_text"`
	CreatedBy    string    `json:"created_by"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

const mediaColumns = `
	id, file_name, original_name, mime_type, byte_size, width, height,
	alt_text, COALESCE(created_by, ''), created_at, updated_at
`

func scanMedia(row pgx.Row) (Media, error) {
	var m Media
	err := row.Scan(
		&m.ID,
		&m.FileName,
		&m.OriginalName,
		&m.MimeType,
		&m.ByteSize,
		&m.Width,
		&m.Height,
		&m.AltText,
		&m.CreatedBy,
		&m.CreatedAt,
		&m.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Media{}, ErrNotFound
	}
	if err != nil {
		return Media{}, fmt.Errorf("scan media: %w", err)
	}
	return m, nil
}

// CreateMedia inserts a media record. Uploads are content-addressed, so a
// duplicate file_name returns the already stored record instead of failing.
func (s *Store) CreateMedia(ctx context.Context, m Media) (Media, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO media (file_name, original_name, mime_type, byte_size, width, height, alt_text, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (file_name) DO UPDATE SET updated_at = NOW()
		RETURNING `+mediaColumns,
		m.FileName, m.OriginalName, m.MimeType, m.ByteSize, m.Width, m.Height, m.AltText, m.CreatedBy,
	)
	return scanMedia(row)
}

func (s *Store) GetMediaByID(ctx context.Context, id int64) (Media, error) {
	row := s.pool.QueryRow(ctx, `SELECT `+mediaColumns+` FROM media WHERE id = $1`, id)
	return scanMedia(row)
}

func (s *Store) ListMedia(ctx context.Context, page, pageSize int) ([]Media, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	var total int
	if err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM media`).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count media: %w", err)
	}

	rows, err := s.pool.Query(ctx, `
		SELECT `+mediaColumns+` FROM media
		ORDER BY created_at DESC, id DESC
		LIMIT $1 OFFSET $2`,
		pageSize, (page-1)*pageSize,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("list media: %w", err)
	}
	defer rows.Close()

	items := make([]Media, 0, pageSize)
	for rows.Next() {
		m, err := scanMedia(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, m)
	}
	return items, total, rows.Err()
}

func (s *Store) UpdateMediaAlt(ctx context.Context, id int64, altText string) (Media, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE media SET alt_text = $2, updated_at = NOW()
		WHERE id = $1
		RETURNING `+mediaColumns,
		id, altText,
	)
	return scanMedia(row)
}

func (s *Store) DeleteMedia(ctx context.Context, id int64) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM media WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete media: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// GetMediaByFileNames returns stored media records keyed by file name.
// Unknown names are simply absent from the result.
func (s *Store) GetMediaByFileNames(ctx context.Context, fileNames []string) (map[string]Media, error) {
	result := make(map[string]Media, len(fileNames))
	if len(fileNames) == 0 {
		return result, nil
	}

	rows, err := s.pool.Query(ctx, `SELECT `+mediaColumns+` FROM media WHERE file_name = ANY($1)`, fileNames)
	if err != nil {
		return nil, fmt.Errorf("get media by file names: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		m, err := scanMedia(rows)
		if err != nil {
			return nil, err
		}
		result[m.FileName] = m
	}
	return result, rows.Err()
}

// CountMediaReferences reports how many blog posts reference the given media
// URL in any content or image field. Deletion is only allowed at zero.
func (s *Store) CountMediaReferences(ctx context.Context, mediaURL string) (int, error) {
	needle := "%" + mediaURL + "%"
	var count int
	err := s.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM blog_posts
		WHERE content_md LIKE $1
		   OR COALESCE(content_json::text, '') LIKE $1
		   OR COALESCE(cover_image_url, '') LIKE $1
		   OR COALESCE(og_image_url, '') LIKE $1`,
		needle,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count media references: %w", err)
	}
	return count, nil
}
