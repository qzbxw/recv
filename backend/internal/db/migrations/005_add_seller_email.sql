ALTER TABLE sellers
ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sellers_email_unique
ON sellers (LOWER(email))
WHERE email IS NOT NULL AND BTRIM(email) <> '';
