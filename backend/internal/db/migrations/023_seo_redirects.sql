CREATE TABLE IF NOT EXISTS seo_redirects (
  id BIGSERIAL PRIMARY KEY,
  source_path TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  status_code INT NOT NULL DEFAULT 301,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seo_redirects_status_check CHECK (status_code IN (301, 302, 308)),
  CONSTRAINT seo_redirects_source_path_check CHECK (source_path LIKE '/%')
);

CREATE INDEX IF NOT EXISTS idx_seo_redirects_active_source
ON seo_redirects (source_path)
WHERE is_active = TRUE;
