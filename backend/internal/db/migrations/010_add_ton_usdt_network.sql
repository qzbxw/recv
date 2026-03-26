DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'network' AND e.enumlabel = 'TON_USDT'
  ) THEN
    ALTER TYPE network ADD VALUE 'TON_USDT';
  END IF;
END $$;
