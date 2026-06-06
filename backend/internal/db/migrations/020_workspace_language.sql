-- Workspace interface language, shared between the web app and the Telegram bot.
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

ALTER TABLE workspaces
    DROP CONSTRAINT IF EXISTS workspaces_language_check;

ALTER TABLE workspaces
    ADD CONSTRAINT workspaces_language_check CHECK (language IN ('en', 'ru'));
