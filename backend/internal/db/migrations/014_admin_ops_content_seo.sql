ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS preview_token TEXT,
  ADD COLUMN IF NOT EXISTS internal_links_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_linking_status TEXT NOT NULL DEFAULT 'unknown';

UPDATE blog_posts
SET status = CASE WHEN is_published THEN 'published' ELSE 'draft' END
WHERE status = 'draft' AND is_published = TRUE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_status_check'
  ) THEN
    ALTER TABLE blog_posts
      ADD CONSTRAINT blog_posts_status_check CHECK (status IN ('draft', 'published'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_preview_token
ON blog_posts (preview_token)
WHERE preview_token IS NOT NULL AND preview_token <> '';

CREATE INDEX IF NOT EXISTS idx_blog_posts_status
ON blog_posts (status);

CREATE INDEX IF NOT EXISTS idx_blog_posts_locale_published
ON blog_posts (locale, published_at DESC);

CREATE TABLE IF NOT EXISTS admin_internal_comments (
  id BIGSERIAL PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  body TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_internal_comments_target_created
ON admin_internal_comments (target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS seo_targets (
  id BIGSERIAL PRIMARY KEY,
  keyword_cluster TEXT NOT NULL,
  target_page TEXT NOT NULL,
  publish_status TEXT NOT NULL DEFAULT 'draft',
  index_status TEXT NOT NULL DEFAULT 'unknown',
  internal_links_count INT NOT NULL DEFAULT 0,
  video_attached BOOLEAN NOT NULL DEFAULT FALSE,
  comparison_page_status TEXT NOT NULL DEFAULT 'missing',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_targets_index_status
ON seo_targets (index_status);

CREATE INDEX IF NOT EXISTS idx_seo_targets_publish_status
ON seo_targets (publish_status);

CREATE INDEX IF NOT EXISTS idx_seo_targets_target_page
ON seo_targets (target_page);

CREATE INDEX IF NOT EXISTS idx_invoices_admin_analytics
ON invoices (status, kind, mode, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_admin_paid
ON invoices (status, kind, plan_code, payable_network, paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status_created
ON webhook_deliveries (status, created_at DESC);
