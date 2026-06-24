-- Migration: 038_bot_retention_and_blocking.sql

-- 1. Add bot_blocked column
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS bot_blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add last_retention_reminder_at column
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS last_retention_reminder_at TIMESTAMPTZ;

-- 3. Add retention_stage column
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS retention_stage TEXT;

-- 4. Create indexes to optimize queries
CREATE INDEX IF NOT EXISTS idx_workspaces_bot_blocked ON workspaces (bot_blocked) WHERE bot_blocked = FALSE;
CREATE INDEX IF NOT EXISTS idx_workspaces_retention ON workspaces (last_retention_reminder_at) WHERE owner_telegram_id IS NOT NULL;
