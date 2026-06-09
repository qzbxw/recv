CREATE TABLE IF NOT EXISTS web_vitals (
  id BIGSERIAL PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  path TEXT NOT NULL,
  locale TEXT NOT NULL,
  navigation_type TEXT NOT NULL DEFAULT 'navigate',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT web_vitals_metric_check CHECK (metric_name IN ('LCP', 'INP', 'CLS')),
  CONSTRAINT web_vitals_value_check CHECK (metric_value >= 0),
  CONSTRAINT web_vitals_path_check CHECK (path LIKE '/%'),
  CONSTRAINT web_vitals_locale_check CHECK (locale IN ('en', 'ru'))
);

CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_recorded
ON web_vitals (metric_name, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_web_vitals_path_recorded
ON web_vitals (path, recorded_at DESC);
