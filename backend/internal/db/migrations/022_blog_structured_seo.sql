ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS h1 TEXT,
  ADD COLUMN IF NOT EXISTS content_json JSONB,
  ADD COLUMN IF NOT EXISTS content_version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS og_title TEXT,
  ADD COLUMN IF NOT EXISTS og_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS robots_index BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS robots_follow BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS include_in_sitemap BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS author_slug TEXT NOT NULL DEFAULT 'recv-core';

UPDATE blog_posts
SET h1 = title
WHERE h1 IS NULL OR btrim(h1) = '';

CREATE INDEX IF NOT EXISTS idx_blog_posts_sitemap
ON blog_posts (locale, updated_at DESC)
WHERE (status = 'published' OR is_published = TRUE)
  AND robots_index = TRUE
  AND include_in_sitemap = TRUE;
