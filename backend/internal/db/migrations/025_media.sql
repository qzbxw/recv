CREATE TABLE IF NOT EXISTS media (
  id BIGSERIAL PRIMARY KEY,
  file_name TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT media_mime_check CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  CONSTRAINT media_byte_size_check CHECK (byte_size > 0),
  CONSTRAINT media_dimensions_check CHECK (width > 0 AND height > 0)
);

CREATE INDEX IF NOT EXISTS idx_media_created_at ON media (created_at DESC);
