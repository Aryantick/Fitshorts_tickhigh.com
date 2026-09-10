-- ===================================================
-- Fitness Reels Platform — Migration 006
-- Add Wellness360 Sri Lanka (Dialog SL) Tenant
-- ===================================================

-- 1. Insert Dialog SL Client Row ("dsl")
INSERT INTO clients (id, name, subdomain, country_code, is_active)
VALUES (3, 'Wellness360 Sri Lanka', 'dsl', 'LK', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), subdomain=VALUES(subdomain);

-- 2. Insert Dialog SL Telecom Config
INSERT INTO telecom_configs (client_id, provider_key, base_url, extra_config, is_active)
VALUES (
  3,
  'DIALOG_SL',
  'https://dsl.wellnesss360.com',
  '{"serviceId": 153, "appId": 3876, "packId": 136416}',
  1
)
ON DUPLICATE KEY UPDATE provider_key=VALUES(provider_key), base_url=VALUES(base_url), extra_config=VALUES(extra_config);
