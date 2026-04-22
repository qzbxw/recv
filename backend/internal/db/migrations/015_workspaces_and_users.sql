-- Migration: 015_workspaces_and_users.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'environment') THEN
    CREATE TYPE environment AS ENUM ('test', 'live');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');
  END IF;
END $$;

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Rename sellers to workspaces
ALTER TABLE sellers RENAME TO workspaces;

-- 3. Create workspace_members table
CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- 4. Data Migration: Create users from workspaces and link them
INSERT INTO users (telegram_id, username, email, created_at)
SELECT COALESCE(telegram_id, -id), username, email, created_at
FROM workspaces
ON CONFLICT (telegram_id) DO NOTHING;

INSERT INTO workspace_members (workspace_id, user_id, role, created_at)
SELECT w.id, u.id, 'owner', w.created_at
FROM workspaces w
JOIN users u ON COALESCE(w.telegram_id, -w.id) = u.telegram_id;

-- 5. Add environment column to relevant tables
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS environment environment NOT NULL DEFAULT 'live';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS environment environment NOT NULL DEFAULT 'live';
ALTER TABLE webhook_endpoints ADD COLUMN IF NOT EXISTS environment environment NOT NULL DEFAULT 'live';
ALTER TABLE payment_events ADD COLUMN IF NOT EXISTS environment environment NOT NULL DEFAULT 'live';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS environment environment NOT NULL DEFAULT 'live';

-- 6. Rename seller_id to workspace_id in all tables
ALTER TABLE workspaces RENAME COLUMN telegram_id TO owner_telegram_id; -- Keep legacy for simple lookup if needed, but primary is members
ALTER TABLE wallets RENAME COLUMN seller_id TO workspace_id;
ALTER TABLE templates RENAME COLUMN seller_id TO workspace_id;
ALTER TABLE invoices RENAME COLUMN seller_id TO workspace_id;
ALTER TABLE notification_outbox RENAME COLUMN seller_id TO workspace_id;
ALTER TABLE api_keys RENAME COLUMN seller_id TO workspace_id;
ALTER TABLE api_request_logs RENAME COLUMN seller_id TO workspace_id;
ALTER TABLE webhook_endpoints RENAME COLUMN seller_id TO workspace_id;
ALTER TABLE webhook_deliveries RENAME COLUMN seller_id TO workspace_id;
ALTER TABLE telegram_auth_codes RENAME COLUMN seller_id TO workspace_id;
ALTER TABLE api_idempotency_records RENAME COLUMN seller_id TO workspace_id;
ALTER TABLE invoice_state_transitions RENAME COLUMN seller_id TO workspace_id;

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_env ON invoices (workspace_id, environment);
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace_env ON api_keys (workspace_id, environment);
