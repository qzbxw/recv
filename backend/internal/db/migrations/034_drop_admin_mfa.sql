DROP TABLE IF EXISTS admin_recovery_codes;

ALTER TABLE admin_users
  DROP COLUMN IF EXISTS totp_secret,
  DROP COLUMN IF EXISTS totp_enabled;
