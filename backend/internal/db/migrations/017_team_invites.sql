-- Migration: 017_team_invites.sql
-- Workspace team management: invitations by Telegram username.
-- workspace_members and the member_role enum already exist (migration 015).

CREATE TABLE IF NOT EXISTS workspace_invites (
  id BIGSERIAL PRIMARY KEY,
  workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_username TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | revoked
  invited_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  accepted_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Only one pending invite per (workspace, username).
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_invites_pending
  ON workspace_invites (workspace_id, lower(invited_username))
  WHERE status = 'pending';

-- Fast lookup of pending invites for a user logging in.
CREATE INDEX IF NOT EXISTS idx_workspace_invites_username_pending
  ON workspace_invites (lower(invited_username))
  WHERE status = 'pending';
