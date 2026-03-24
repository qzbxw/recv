WITH ranked_usernames AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(username)
      ORDER BY telegram_linked_at DESC NULLS LAST, created_at DESC, id DESC
    ) AS row_num
  FROM sellers
  WHERE username IS NOT NULL AND BTRIM(username) <> ''
)
UPDATE sellers AS sellers_to_update
SET username = NULL
FROM ranked_usernames
WHERE sellers_to_update.id = ranked_usernames.id
  AND ranked_usernames.row_num > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sellers_username_unique
ON sellers (LOWER(username))
WHERE username IS NOT NULL AND BTRIM(username) <> '';

CREATE TABLE IF NOT EXISTS telegram_auth_codes (
  id BIGSERIAL PRIMARY KEY,
  seller_id BIGINT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_auth_codes_active
ON telegram_auth_codes (seller_id, created_at DESC)
WHERE consumed_at IS NULL;
