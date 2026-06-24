-- Migration: 039_expand_supported_languages.sql

ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_language_check;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_language_check CHECK (language IN ('en', 'ru', 'es', 'pt'));
