-- ===================================================
-- Fitness Reels Platform — Migration 003
-- Multi-Tenant & Telecom Adapter Schema
-- ===================================================

-- 1. Create Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subdomain VARCHAR(100) NOT NULL UNIQUE,
  country_code VARCHAR(10) DEFAULT 'SS',
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert Default Client Rows ("backreel" & "obf")
INSERT INTO clients (id, name, subdomain, country_code, is_active)
VALUES 
  (1, 'Wellness360 Default', 'backreel', 'SS', 1),
  (2, 'Orange Burkina Faso', 'obf', 'BF', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), subdomain=VALUES(subdomain);

-- 3. Create Telecom Configs Table (No auth_flow_type column)
CREATE TABLE IF NOT EXISTS telecom_configs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  client_id BIGINT NOT NULL UNIQUE,
  provider_key VARCHAR(50) NOT NULL,
  base_url VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) NULL,
  api_secret VARCHAR(255) NULL,
  extra_config JSON NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 4. Insert Default Telecom Configs (ZAIN & ORANGE_BF)
INSERT INTO telecom_configs (client_id, provider_key, base_url, extra_config, is_active)
VALUES 
(
  1,
  'ZAIN',
  'https://wbilzss.tickhighs.com',
  '{"serviceId": "WELLNESS", "cpId": "100", "channel": "wap", "country": "SS", "operator": "ZAIN", "reqType": "1", "language": "_E", "allowedPlans": ["FDaily", "FWeekly", "FMonthly"]}',
  1
),
(
  2,
  'ORANGE_BF',
  'https://obfpartner.telecomnetsolution.com',
  '{"serviceId": "Health Portal Livliness", "cpId": "100", "channel": "wap", "country": "BF", "operator": "ORG", "reqType": "1", "allowedPlans": ["Health Portal Livliness pass jour", "Health Portal Livliness pass semaine", "Health Portal Livliness pass mois", "Health Portal Livliness acte jour", "Health Portal Livliness acte semaine", "Health Portal Livliness acte mois"]}',
  1
)
ON DUPLICATE KEY UPDATE provider_key=VALUES(provider_key), base_url=VALUES(base_url), extra_config=VALUES(extra_config);

-- 5. Create User Client Relations Table
CREATE TABLE IF NOT EXISTS user_client_relations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  client_id BIGINT NOT NULL,
  first_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_client (user_id, client_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
