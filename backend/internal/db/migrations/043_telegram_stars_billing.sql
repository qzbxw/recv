CREATE TABLE IF NOT EXISTS telegram_star_payments (
  id BIGSERIAL PRIMARY KEY,
  payload TEXT NOT NULL UNIQUE,
  workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL,
  subscription_days INT NOT NULL,
  base_amount_usd NUMERIC(18, 6) NOT NULL,
  stars_amount INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  telegram_payment_charge_id TEXT UNIQUE,
  provider_payment_charge_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (subscription_days > 0),
  CHECK (base_amount_usd > 0),
  CHECK (stars_amount > 0),
  CHECK (status IN ('pending', 'paid', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_telegram_star_payments_workspace_created
  ON telegram_star_payments (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_telegram_star_payments_pending
  ON telegram_star_payments (status, created_at DESC)
  WHERE status = 'pending';
