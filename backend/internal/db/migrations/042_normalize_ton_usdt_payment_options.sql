UPDATE invoice_payment_options
SET network = 'TON'
WHERE network::text = 'TON_USDT'
  AND asset = 'USDT';

UPDATE invoices
SET payable_network = 'TON'
WHERE payable_network::text = 'TON_USDT';

UPDATE payment_events
SET network = 'TON'
WHERE network::text = 'TON_USDT'
  AND asset = 'USDT';

UPDATE watcher_checkpoints
SET payable_network = 'TON'
WHERE payable_network::text = 'TON_USDT'
  AND asset = 'USDT';
