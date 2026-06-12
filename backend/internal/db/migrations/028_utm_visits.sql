CREATE TABLE IF NOT EXISTS utm_visits (
  id BIGSERIAL PRIMARY KEY,
  attribution_id TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  term TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  landing_path TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_utm_visits_campaign_created
  ON utm_visits (source, medium, campaign, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_utm_visits_created
  ON utm_visits (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_utm_attributions_campaign
  ON utm_attributions (source, medium, campaign, created_at DESC);
