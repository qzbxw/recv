ALTER TYPE network ADD VALUE IF NOT EXISTS 'SOLANA';
ALTER TYPE network ADD VALUE IF NOT EXISTS 'ARBITRUM';

ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS asset TEXT NOT NULL DEFAULT 'USDT';

UPDATE payment_events
SET asset = CASE
  WHEN network::text = 'TON' THEN 'TON'
  ELSE 'USDT'
END
WHERE asset = '' OR asset IS NULL;

CREATE TABLE IF NOT EXISTS invoice_payment_options (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  network network NOT NULL,
  asset TEXT NOT NULL,
  payable_amount NUMERIC(24, 9) NOT NULL,
  destination_address TEXT NOT NULL,
  payment_comment TEXT,
  matching_suffix NUMERIC(12, 6),
  payment_uri TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invoice_id, network, asset)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_payment_options_default
ON invoice_payment_options (invoice_id)
WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_invoice_payment_options_match_amount
ON invoice_payment_options (network, asset, destination_address, payable_amount);

CREATE INDEX IF NOT EXISTS idx_invoice_payment_options_match_comment
ON invoice_payment_options (network, asset, destination_address, payment_comment)
WHERE payment_comment IS NOT NULL;

INSERT INTO invoice_payment_options (
  invoice_id,
  network,
  asset,
  payable_amount,
  destination_address,
  payment_comment,
  matching_suffix,
  is_default
)
SELECT
  id,
  payable_network,
  CASE WHEN payable_network::text = 'TON' THEN 'TON' ELSE 'USDT' END,
  payable_amount,
  destination_address,
  payment_comment,
  matching_suffix,
  TRUE
FROM invoices
ON CONFLICT (invoice_id, network, asset) DO NOTHING;

ALTER TABLE watcher_checkpoints
  ADD COLUMN IF NOT EXISTS asset TEXT NOT NULL DEFAULT 'USDT';

UPDATE watcher_checkpoints
SET asset = CASE
  WHEN payable_network = 'TON' THEN 'TON'
  ELSE 'USDT'
END
WHERE asset = '' OR asset IS NULL;

ALTER TABLE watcher_checkpoints
  DROP CONSTRAINT IF EXISTS watcher_checkpoints_poll_network_payable_network_destination_address_key,
  DROP CONSTRAINT IF EXISTS watcher_checkpoints_poll_network_payable_network_destinatio_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_watcher_checkpoints_asset_key
ON watcher_checkpoints (poll_network, payable_network, asset, destination_address);
