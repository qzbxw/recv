ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'overpaid';

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS received_amount NUMERIC(24, 9) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_event_id BIGINT REFERENCES payment_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_reason TEXT,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;

ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS external_event_id TEXT,
  ADD COLUMN IF NOT EXISTS allocated_amount NUMERIC(24, 9) NOT NULL DEFAULT 0;

ALTER TABLE payment_events
  DROP CONSTRAINT IF EXISTS payment_events_tx_hash_key;

UPDATE payment_events
SET external_event_id = network::text || ':' || tx_hash
WHERE external_event_id IS NULL OR external_event_id = '';

ALTER TABLE payment_events
  ALTER COLUMN external_event_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_external_event_id
ON payment_events (external_event_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_invoice_created
ON payment_events (matched_invoice_id, created_at DESC);

CREATE TABLE IF NOT EXISTS invoice_state_transitions (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  seller_id BIGINT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  from_status invoice_status,
  to_status invoice_status NOT NULL,
  reason TEXT NOT NULL,
  payment_event_id BIGINT REFERENCES payment_events(id) ON DELETE SET NULL,
  observed_amount NUMERIC(24, 9),
  cumulative_received_amount NUMERIC(24, 9) NOT NULL DEFAULT 0,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_state_transitions_invoice_created
ON invoice_state_transitions (invoice_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_event_id BIGINT NOT NULL REFERENCES payment_events(id) ON DELETE CASCADE,
  amount NUMERIC(24, 9) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invoice_id, payment_event_id)
);

CREATE TABLE IF NOT EXISTS webhook_delivery_attempts (
  id BIGSERIAL PRIMARY KEY,
  delivery_id BIGINT NOT NULL REFERENCES webhook_deliveries(id) ON DELETE CASCADE,
  endpoint_id BIGINT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL,
  status TEXT NOT NULL,
  http_status INT,
  error TEXT,
  duration_ms BIGINT NOT NULL DEFAULT 0,
  response_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (delivery_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_attempts_delivery_created
ON webhook_delivery_attempts (delivery_id, created_at DESC);

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_config_audit (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_events (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_events_created
ON admin_audit_events (created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  window_seconds INT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_updated
ON rate_limit_buckets (updated_at);

ALTER TABLE watcher_checkpoints
  ADD COLUMN IF NOT EXISTS last_event_id TEXT;
