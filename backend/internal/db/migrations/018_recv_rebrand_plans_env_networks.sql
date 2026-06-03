UPDATE workspaces
SET plan_code = 'business'
WHERE plan_code = 'enterprise';

UPDATE invoices
SET plan_code = 'business'
WHERE plan_code = 'enterprise';

UPDATE api_keys
SET prefix = regexp_replace(prefix, '^(rqst_|rk_)?live_', 'live_')
WHERE prefix ~ '^(rqst_|rk_)?live_';

UPDATE api_keys
SET prefix = regexp_replace(prefix, '^(rqst_|rk_)?test_', 'test_')
WHERE prefix ~ '^(rqst_|rk_)?test_';

UPDATE api_keys
SET mode = 'test'
WHERE prefix LIKE 'test_%';

UPDATE api_keys
SET mode = 'live'
WHERE prefix LIKE 'live_%' OR mode NOT IN ('test', 'live');

UPDATE api_keys
SET environment = CASE WHEN prefix LIKE 'test_%' THEN 'test'::environment ELSE 'live'::environment END
WHERE environment IS NULL OR environment::text NOT IN ('test', 'live') OR prefix LIKE 'test_%' OR prefix LIKE 'live_%';

UPDATE webhook_endpoints
SET environment = 'live'::environment
WHERE environment IS NULL OR environment::text NOT IN ('test', 'live');

UPDATE wallets
SET environment = 'live'::environment
WHERE environment IS NULL OR environment::text NOT IN ('test', 'live');

UPDATE invoices
SET environment = CASE WHEN mode = 'test' THEN 'test'::environment ELSE 'live'::environment END
WHERE environment IS NULL OR environment::text NOT IN ('test', 'live') OR mode IN ('test', 'live');

UPDATE payment_events
SET environment = 'live'::environment
WHERE environment IS NULL OR environment::text NOT IN ('test', 'live');
