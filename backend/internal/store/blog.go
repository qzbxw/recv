package store

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

const blogPostSelectColumns = `
	id,
	slug,
	title,
	content_md,
	excerpt,
	cover_image_url,
	author,
	is_published,
	status,
	meta_title,
	meta_description,
	canonical_url,
	tags,
	locale,
	preview_token,
	internal_links_count,
	internal_linking_status,
	published_at,
	created_at,
	updated_at
`

func scanBlogPost(row pgx.Row) (BlogPost, error) {
	var p BlogPost
	err := row.Scan(
		&p.ID,
		&p.Slug,
		&p.Title,
		&p.ContentMD,
		&p.Excerpt,
		&p.CoverImageURL,
		&p.Author,
		&p.IsPublished,
		&p.Status,
		&p.MetaTitle,
		&p.MetaDescription,
		&p.CanonicalURL,
		&p.Tags,
		&p.Locale,
		&p.PreviewToken,
		&p.InternalLinksCount,
		&p.InternalLinkingStatus,
		&p.PublishedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return BlogPost{}, ErrNotFound
	}
	if err != nil {
		return BlogPost{}, fmt.Errorf("scan blog post: %w", err)
	}
	return p, nil
}

func (s *Store) CreateBlogPost(ctx context.Context, post BlogPost) (BlogPost, error) {
	post = normalizeBlogPostForWrite(post)
	row := s.pool.QueryRow(ctx, `
		INSERT INTO blog_posts (
			slug, title, content_md, excerpt, cover_image_url, author, is_published, status,
			meta_title, meta_description, canonical_url, tags, locale, preview_token,
			internal_links_count, internal_linking_status, published_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		RETURNING `+blogPostSelectColumns+`
	`, post.Slug, post.Title, post.ContentMD, post.Excerpt, post.CoverImageURL, post.Author, post.IsPublished, post.Status,
		post.MetaTitle, post.MetaDescription, post.CanonicalURL, post.Tags, post.Locale, post.PreviewToken, post.InternalLinksCount, post.InternalLinkingStatus, post.PublishedAt)
	return scanBlogPost(row)
}

func (s *Store) UpdateBlogPost(ctx context.Context, id int64, post BlogPost) (BlogPost, error) {
	post = normalizeBlogPostForWrite(post)
	row := s.pool.QueryRow(ctx, `
		UPDATE blog_posts
		SET slug = $1,
		    title = $2,
		    content_md = $3,
		    excerpt = $4,
		    cover_image_url = $5,
		    author = $6,
		    is_published = $7,
		    status = $8,
		    meta_title = $9,
		    meta_description = $10,
		    canonical_url = $11,
		    tags = $12,
		    locale = $13,
		    preview_token = $14,
		    internal_links_count = $15,
		    internal_linking_status = $16,
		    published_at = $17,
		    updated_at = NOW()
		WHERE id = $18
		RETURNING `+blogPostSelectColumns+`
	`, post.Slug, post.Title, post.ContentMD, post.Excerpt, post.CoverImageURL, post.Author, post.IsPublished, post.Status,
		post.MetaTitle, post.MetaDescription, post.CanonicalURL, post.Tags, post.Locale, post.PreviewToken, post.InternalLinksCount, post.InternalLinkingStatus, post.PublishedAt, id)
	return scanBlogPost(row)
}

func (s *Store) DeleteBlogPost(ctx context.Context, id int64) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM blog_posts WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete blog post: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) GetBlogPostBySlug(ctx context.Context, slug string) (BlogPost, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+blogPostSelectColumns+`
		FROM blog_posts
		WHERE slug = $1
	`, slug)
	return scanBlogPost(row)
}

func (s *Store) ListBlogPosts(ctx context.Context, page, pageSize int, onlyPublished bool) ([]BlogPost, int, error) {
	var total int
	countQuery := `SELECT COUNT(1) FROM blog_posts`
	if onlyPublished {
		countQuery += ` WHERE status = 'published' OR is_published = TRUE`
	}
	if err := s.pool.QueryRow(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count blog posts: %w", err)
	}

	query := `SELECT ` + blogPostSelectColumns + ` FROM blog_posts`
	if onlyPublished {
		query += ` WHERE status = 'published' OR is_published = TRUE`
	}
	query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`

	offset := (page - 1) * pageSize
	if offset < 0 {
		offset = 0
	}

	rows, err := s.pool.Query(ctx, query, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list blog posts: %w", err)
	}
	defer rows.Close()

	var posts []BlogPost
	for rows.Next() {
		post, err := scanBlogPost(rows)
		if err != nil {
			return nil, 0, err
		}
		posts = append(posts, post)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return posts, total, nil
}

func (s *Store) ListPublishedBlogPosts(ctx context.Context, page, pageSize int, locale string) ([]BlogPost, int, error) {
	where := ` WHERE (status = 'published' OR is_published = TRUE)`
	args := []any{}
	if locale != "" {
		where += ` AND locale = $1`
		args = append(args, locale)
	}

	var total int
	if err := s.pool.QueryRow(ctx, `SELECT COUNT(1) FROM blog_posts`+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count published blog posts: %w", err)
	}

	pagePlaceholder := len(args) + 1
	offsetPlaceholder := len(args) + 2
	query := fmt.Sprintf(
		`SELECT %s FROM blog_posts%s ORDER BY updated_at DESC LIMIT $%d OFFSET $%d`,
		blogPostSelectColumns,
		where,
		pagePlaceholder,
		offsetPlaceholder,
	)

	offset := (page - 1) * pageSize
	if offset < 0 {
		offset = 0
	}
	args = append(args, pageSize, offset)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list published blog posts: %w", err)
	}
	defer rows.Close()

	var posts []BlogPost
	for rows.Next() {
		post, err := scanBlogPost(rows)
		if err != nil {
			return nil, 0, err
		}
		posts = append(posts, post)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return posts, total, nil
}

func normalizeBlogPostForWrite(post BlogPost) BlogPost {
	if post.Status == "" {
		if post.IsPublished {
			post.Status = "published"
		} else {
			post.Status = "draft"
		}
	}
	if post.Status != "published" {
		post.Status = "draft"
	}
	post.IsPublished = post.Status == "published"
	if post.Locale == "" {
		post.Locale = "en"
	}
	if post.InternalLinkingStatus == "" {
		post.InternalLinkingStatus = "unknown"
	}
	return post
}
