-- Migration: 041_restrict_supported_languages.sql

UPDATE workspaces
SET language = 'en'
WHERE language IN ('es', 'pt');

ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_language_check;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_language_check CHECK (language IN ('en', 'ru', 'uk', 'uz', 'de'));
