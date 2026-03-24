DROP TABLE IF EXISTS email_auth_codes;

ALTER TABLE sellers
  DROP COLUMN IF EXISTS password_hash,
  DROP COLUMN IF EXISTS email_verified_at;
