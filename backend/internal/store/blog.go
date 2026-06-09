package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

const blogPostSelectColumns = `
	id,
	slug,
	title,
	h1,
	content_md,
	content_json,
	content_version,
	excerpt,
	cover_image_url,
	author,
	is_published,
	status,
	meta_title,
	meta_description,
	canonical_url,
	og_title,
	og_description,
	og_image_url,
	cover_image_alt,
	robots_index,
	robots_follow,
	include_in_sitemap,
	author_slug,
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
		&p.H1,
		&p.ContentMD,
		&p.ContentJSON,
		&p.ContentVersion,
		&p.Excerpt,
		&p.CoverImageURL,
		&p.Author,
		&p.IsPublished,
		&p.Status,
		&p.MetaTitle,
		&p.MetaDescription,
		&p.CanonicalURL,
		&p.OGTitle,
		&p.OGDescription,
		&p.OGImageURL,
		&p.CoverImageAlt,
		&p.RobotsIndex,
		&p.RobotsFollow,
		&p.IncludeInSitemap,
		&p.AuthorSlug,
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
			slug, title, h1, content_md, content_json, content_version, excerpt, cover_image_url, author, is_published, status,
			meta_title, meta_description, canonical_url, og_title, og_description, og_image_url,
			cover_image_alt, robots_index, robots_follow, include_in_sitemap, author_slug,
			tags, locale, preview_token,
			internal_links_count, internal_linking_status, published_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
		RETURNING `+blogPostSelectColumns+`
	`, post.Slug, post.Title, post.H1, post.ContentMD, nullableJSON(post.ContentJSON), post.ContentVersion,
		post.Excerpt, post.CoverImageURL, post.Author, post.IsPublished, post.Status,
		post.MetaTitle, post.MetaDescription, post.CanonicalURL, post.OGTitle, post.OGDescription, post.OGImageURL,
		post.CoverImageAlt, post.RobotsIndex, post.RobotsFollow, post.IncludeInSitemap, post.AuthorSlug,
		post.Tags, post.Locale, post.PreviewToken, post.InternalLinksCount, post.InternalLinkingStatus, post.PublishedAt)
	return scanBlogPost(row)
}

func (s *Store) UpdateBlogPost(ctx context.Context, id int64, post BlogPost) (BlogPost, error) {
	post = normalizeBlogPostForWrite(post)
	row := s.pool.QueryRow(ctx, `
		UPDATE blog_posts
		SET slug = $1,
		    title = $2,
		    h1 = $3,
		    content_md = $4,
		    content_json = $5,
		    content_version = $6,
		    excerpt = $7,
		    cover_image_url = $8,
		    author = $9,
		    is_published = $10,
		    status = $11,
		    meta_title = $12,
		    meta_description = $13,
		    canonical_url = $14,
		    og_title = $15,
		    og_description = $16,
		    og_image_url = $17,
		    cover_image_alt = $18,
		    robots_index = $19,
		    robots_follow = $20,
		    include_in_sitemap = $21,
		    author_slug = $22,
		    tags = $23,
		    locale = $24,
		    preview_token = $25,
		    internal_links_count = $26,
		    internal_linking_status = $27,
		    published_at = $28,
		    updated_at = NOW()
		WHERE id = $29
		RETURNING `+blogPostSelectColumns+`
	`, post.Slug, post.Title, post.H1, post.ContentMD, nullableJSON(post.ContentJSON), post.ContentVersion,
		post.Excerpt, post.CoverImageURL, post.Author, post.IsPublished, post.Status,
		post.MetaTitle, post.MetaDescription, post.CanonicalURL, post.OGTitle, post.OGDescription, post.OGImageURL,
		post.CoverImageAlt, post.RobotsIndex, post.RobotsFollow, post.IncludeInSitemap, post.AuthorSlug,
		post.Tags, post.Locale, post.PreviewToken, post.InternalLinksCount, post.InternalLinkingStatus, post.PublishedAt, id)
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

// GetBlogPostBySlug returns the post for the given slug. When locale is
// non-empty the lookup is scoped to that locale's translation; otherwise the
// English translation is preferred, falling back to any available locale.
func (s *Store) GetBlogPostBySlug(ctx context.Context, slug, locale string) (BlogPost, error) {
	if locale != "" {
		row := s.pool.QueryRow(ctx, `
			SELECT `+blogPostSelectColumns+`
			FROM blog_posts
			WHERE slug = $1 AND locale = $2
		`, slug, locale)
		return scanBlogPost(row)
	}
	row := s.pool.QueryRow(ctx, `
		SELECT `+blogPostSelectColumns+`
		FROM blog_posts
		WHERE slug = $1
		ORDER BY (locale = 'en') DESC, id ASC
		LIMIT 1
	`, slug)
	return scanBlogPost(row)
}

// ListPublishedBlogLocalesBySlug returns the distinct locales for which a
// published translation of the given slug exists.
func (s *Store) ListPublishedBlogLocalesBySlug(ctx context.Context, slug string) ([]string, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT locale
		FROM blog_posts
		WHERE slug = $1 AND (status = 'published' OR is_published = TRUE)
		ORDER BY locale
	`, slug)
	if err != nil {
		return nil, fmt.Errorf("list blog post locales: %w", err)
	}
	defer rows.Close()

	var locales []string
	for rows.Next() {
		var locale string
		if err := rows.Scan(&locale); err != nil {
			return nil, err
		}
		locales = append(locales, locale)
	}
	return locales, rows.Err()
}

func (s *Store) ListPublishedBlogLocalesBySlugs(ctx context.Context, slugs []string) (map[string][]string, error) {
	result := make(map[string][]string, len(slugs))
	if len(slugs) == 0 {
		return result, nil
	}

	rows, err := s.pool.Query(ctx, `
		SELECT slug, array_agg(DISTINCT locale ORDER BY locale)
		FROM blog_posts
		WHERE slug = ANY($1) AND (status = 'published' OR is_published = TRUE)
		GROUP BY slug
	`, slugs)
	if err != nil {
		return nil, fmt.Errorf("list blog post locales by slugs: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var slug string
		var locales []string
		if err := rows.Scan(&slug, &locales); err != nil {
			return nil, err
		}
		result[slug] = locales
	}
	return result, rows.Err()
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
	return s.listPublishedBlogPosts(ctx, page, pageSize, locale, false)
}

func (s *Store) ListPublishedBlogSitemapPosts(ctx context.Context, page, pageSize int, locale string) ([]BlogPost, int, error) {
	return s.listPublishedBlogPosts(ctx, page, pageSize, locale, true)
}

func (s *Store) listPublishedBlogPosts(ctx context.Context, page, pageSize int, locale string, sitemapOnly bool) ([]BlogPost, int, error) {
	where := ` WHERE (status = 'published' OR is_published = TRUE)`
	args := []any{}
	if sitemapOnly {
		where += ` AND robots_index = TRUE AND include_in_sitemap = TRUE`
	}
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
	if post.ContentVersion < 1 {
		post.ContentVersion = 1
	}
	if post.AuthorSlug == "" {
		post.AuthorSlug = "recv-core"
	}
	return post
}

func nullableJSON(value json.RawMessage) any {
	if len(value) == 0 || string(value) == "null" {
		return nil
	}
	return value
}
