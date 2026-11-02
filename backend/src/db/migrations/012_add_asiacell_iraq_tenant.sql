-- ===================================================
-- Fitness Reels Platform — Migration 012
-- Add Asiacell Iraq (Beecell Gateway) Tenant
-- ===================================================

-- 1. Insert Client Row ("asiq")
INSERT INTO clients (id, name, subdomain, country_code, is_active)
VALUES (7, 'Asiacell Iraq Wellness360', 'asiq', 'IQ', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), subdomain=VALUES(subdomain), country_code=VALUES(country_code);

-- 2. Insert Telecom Config
INSERT INTO telecom_configs (client_id, provider_key, base_url, extra_config, is_active)
VALUES (
  7,
  'ASIACELL_IRAQ',
  'https://bilunipal.tickhighs.com',
  '{"serviceId": "13237", "directAccess": true, "allowedPlans": ["Daily"]}',
  1
)
ON DUPLICATE KEY UPDATE provider_key=VALUES(provider_key), base_url=VALUES(base_url), extra_config=VALUES(extra_config);

