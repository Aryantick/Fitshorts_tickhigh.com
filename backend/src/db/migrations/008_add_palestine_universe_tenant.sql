-- ===================================================
-- Fitness Reels Platform — Migration 008
-- Add Palestine Universe (Ooredoo Palestine) Tenant
-- ===================================================

-- 1. Insert Client Row ("opal")
INSERT INTO clients (id, name, subdomain, country_code, is_active)
VALUES (4, 'Ooredoo Palestine Universe', 'opal', 'PS', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), subdomain=VALUES(subdomain), country_code=VALUES(country_code);

-- 2. Insert Telecom Config
INSERT INTO telecom_configs (client_id, provider_key, base_url, extra_config, is_active)
VALUES (
  4,
  'OOREDOO_PALESTINE',
  'https://bilunipal.tickhighs.com',
  '{"serviceId": "581", "merchantId": "169", "operator": "WM", "purchaseTypeId": 2, "transactionChannel": "Wifi", "directAccess": true, "allowedPlans": ["RenewalDaily"]}',
  1
)
ON DUPLICATE KEY UPDATE provider_key=VALUES(provider_key), base_url=VALUES(base_url), extra_config=VALUES(extra_config);
