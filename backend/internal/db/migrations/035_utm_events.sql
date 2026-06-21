CREATE TABLE IF NOT EXISTS utm_events (
  id BIGSERIAL PRIMARY KEY,
  attribution_id TEXT NOT NULL DEFAULT '',
  event_name TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  term TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_utm_events_attr_created
  ON utm_events (attribution_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_utm_events_campaign_created
  ON utm_events (source, medium, campaign, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_utm_events_name_created
  ON utm_events (event_name, created_at DESC);
