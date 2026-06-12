-- Referral program: partners get a code (recv.money/?ref=code), referred
-- workspaces are linked at signup and commission accrues from their paid
-- subscription invoices. Payouts are recorded manually (USDT sent by hand).

CREATE TABLE IF NOT EXISTS referral_partners (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  commission_pct NUMERIC(5, 2) NOT NULL DEFAULT 25,
  launch_commission_pct NUMERIC(5, 2),
  launch_ends_at TIMESTAMPTZ,
  payout_address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_partners_commission_pct_check CHECK (commission_pct >= 0 AND commission_pct <= 100),
  CONSTRAINT referral_partners_launch_commission_pct_check CHECK (
    launch_commission_pct IS NULL OR (launch_commission_pct >= 0 AND launch_commission_pct <= 100)
  )
);

-- One partner per workspace, first attribution wins.
CREATE TABLE IF NOT EXISTS referral_signups (
  workspace_id BIGINT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  partner_id BIGINT NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_signups_partner
  ON referral_signups (partner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS referral_payouts (
  id BIGSERIAL PRIMARY KEY,
  partner_id BIGINT NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
  amount_usd NUMERIC(18, 6) NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_payouts_amount_check CHECK (amount_usd > 0)
);

CREATE INDEX IF NOT EXISTS idx_referral_payouts_partner
  ON referral_payouts (partner_id, paid_at DESC);
