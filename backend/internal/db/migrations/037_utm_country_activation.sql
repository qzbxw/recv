ALTER TABLE utm_visits
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '';

ALTER TABLE utm_events
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_utm_visits_country_created
  ON utm_visits (country, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_utm_events_country_created
  ON utm_events (country, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_events_name_created
  ON product_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_events_invoice_name_created
  ON product_events (invoice_id, event_name, created_at DESC);
