ALTER TABLE promo_codes ADD COLUMN discount_percent INT NOT NULL DEFAULT 0;

ALTER TABLE workspaces 
ADD COLUMN discount_percent INT NOT NULL DEFAULT 0,
ADD COLUMN discount_plan_code TEXT;
