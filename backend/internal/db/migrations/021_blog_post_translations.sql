-- Allow the same slug to exist across locales so a single article can carry
-- per-locale translations (e.g. /en/blog/foo and /ru/blog/foo).
-- Previously slug was globally UNIQUE, which forced translations to use a
-- different slug and live as a separate, unlinked article.
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug_locale
ON blog_posts (slug, locale);
