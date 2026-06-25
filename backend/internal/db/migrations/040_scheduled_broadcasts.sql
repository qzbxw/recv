-- Migration 040: Scheduled Telegram Broadcasts
CREATE TABLE IF NOT EXISTS scheduled_broadcasts (
  id BIGSERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scheduled_broadcasts_pending 
  ON scheduled_broadcasts (status, scheduled_at);
