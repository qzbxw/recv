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

ALTER TABLE utm_visits
  ADD COLUMN IF NOT EXISTS attribution_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS medium TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS campaign TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS term TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS landing_path TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS referrer TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE utm_attributions
  ADD COLUMN IF NOT EXISTS attribution_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS medium TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS campaign TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS term TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS landing_path TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS referrer TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE utm_events
  ADD COLUMN IF NOT EXISTS attribution_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS event_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS medium TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS campaign TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS term TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS path TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS referrer TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS properties JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE utm_visits
SET attribution_id = COALESCE(attribution_id, ''),
    source = COALESCE(source, ''),
    medium = COALESCE(medium, ''),
    campaign = COALESCE(campaign, ''),
    term = COALESCE(term, ''),
    content = COALESCE(content, ''),
    landing_path = COALESCE(landing_path, ''),
    referrer = COALESCE(referrer, ''),
    created_at = COALESCE(created_at, NOW());

UPDATE utm_attributions
SET attribution_id = COALESCE(attribution_id, ''),
    source = COALESCE(source, ''),
    medium = COALESCE(medium, ''),
    campaign = COALESCE(campaign, ''),
    term = COALESCE(term, ''),
    content = COALESCE(content, ''),
    landing_path = COALESCE(landing_path, ''),
    referrer = COALESCE(referrer, ''),
    created_at = COALESCE(created_at, NOW());

UPDATE utm_events
SET attribution_id = COALESCE(attribution_id, ''),
    event_name = COALESCE(event_name, ''),
    source = COALESCE(source, ''),
    medium = COALESCE(medium, ''),
    campaign = COALESCE(campaign, ''),
    term = COALESCE(term, ''),
    content = COALESCE(content, ''),
    path = COALESCE(path, ''),
    title = COALESCE(title, ''),
    referrer = COALESCE(referrer, ''),
    properties = COALESCE(properties, '{}'::jsonb),
    created_at = COALESCE(created_at, NOW());

ALTER TABLE utm_visits
  ALTER COLUMN attribution_id SET DEFAULT '',
  ALTER COLUMN attribution_id SET NOT NULL,
  ALTER COLUMN source SET DEFAULT '',
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN medium SET DEFAULT '',
  ALTER COLUMN medium SET NOT NULL,
  ALTER COLUMN campaign SET DEFAULT '',
  ALTER COLUMN campaign SET NOT NULL,
  ALTER COLUMN term SET DEFAULT '',
  ALTER COLUMN term SET NOT NULL,
  ALTER COLUMN content SET DEFAULT '',
  ALTER COLUMN content SET NOT NULL,
  ALTER COLUMN landing_path SET DEFAULT '',
  ALTER COLUMN landing_path SET NOT NULL,
  ALTER COLUMN referrer SET DEFAULT '',
  ALTER COLUMN referrer SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE utm_attributions
  ALTER COLUMN attribution_id SET DEFAULT '',
  ALTER COLUMN attribution_id SET NOT NULL,
  ALTER COLUMN source SET DEFAULT '',
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN medium SET DEFAULT '',
  ALTER COLUMN medium SET NOT NULL,
  ALTER COLUMN campaign SET DEFAULT '',
  ALTER COLUMN campaign SET NOT NULL,
  ALTER COLUMN term SET DEFAULT '',
  ALTER COLUMN term SET NOT NULL,
  ALTER COLUMN content SET DEFAULT '',
  ALTER COLUMN content SET NOT NULL,
  ALTER COLUMN landing_path SET DEFAULT '',
  ALTER COLUMN landing_path SET NOT NULL,
  ALTER COLUMN referrer SET DEFAULT '',
  ALTER COLUMN referrer SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE utm_events
  ALTER COLUMN attribution_id SET DEFAULT '',
  ALTER COLUMN attribution_id SET NOT NULL,
  ALTER COLUMN event_name SET DEFAULT '',
  ALTER COLUMN event_name SET NOT NULL,
  ALTER COLUMN source SET DEFAULT '',
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN medium SET DEFAULT '',
  ALTER COLUMN medium SET NOT NULL,
  ALTER COLUMN campaign SET DEFAULT '',
  ALTER COLUMN campaign SET NOT NULL,
  ALTER COLUMN term SET DEFAULT '',
  ALTER COLUMN term SET NOT NULL,
  ALTER COLUMN content SET DEFAULT '',
  ALTER COLUMN content SET NOT NULL,
  ALTER COLUMN path SET DEFAULT '',
  ALTER COLUMN path SET NOT NULL,
  ALTER COLUMN title SET DEFAULT '',
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN referrer SET DEFAULT '',
  ALTER COLUMN referrer SET NOT NULL,
  ALTER COLUMN properties SET DEFAULT '{}'::jsonb,
  ALTER COLUMN properties SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_utm_events_attr_created
  ON utm_events (attribution_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_utm_events_campaign_created
  ON utm_events (source, medium, campaign, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_utm_events_name_created
  ON utm_events (event_name, created_at DESC);
