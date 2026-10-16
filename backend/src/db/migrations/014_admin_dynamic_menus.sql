-- Migration 014: Dynamic Admin Menus Table and Master Seed
CREATE TABLE IF NOT EXISTS admin_menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  path VARCHAR(255) NULL,
  icon VARCHAR(50) NOT NULL DEFAULT "dashboard",
  page_key VARCHAR(50) NOT NULL,
  parent_id INT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_menus_parent FOREIGN KEY (parent_id) REFERENCES admin_menus(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Root Menus
INSERT INTO admin_menus (id, label, path, icon, page_key, parent_id, order_index, is_active)
VALUES
  (1, "Overview", "/", "dashboard", "dashboard", NULL, 1, 1),
  (2, "Role & Permission", "/role&permission", "shield", "roles", NULL, 2, 1),
  (3, "Reels Moderation", "/moderation/reels", "reels", "moderation", NULL, 3, 1),
  (4, "Categories", "/categories", "categories", "categories", NULL, 4, 1),
  (5, "Music Library", "/music", "music", "music", NULL, 5, 1),
  (6, "Analytics", "/analytics", "analytics", "analytics", NULL, 6, 1),
  (7, "Management", NULL, "settings", "settings", NULL, 7, 1)
ON DUPLICATE KEY UPDATE label=VALUES(label), path=VALUES(path), icon=VALUES(icon), page_key=VALUES(page_key);

-- Seed Submenus under Management (parent_id = 7)
INSERT INTO admin_menus (id, label, path, icon, page_key, parent_id, order_index, is_active)
VALUES
  (8, "Admin Accounts", "/settings/admins", "users", "admins", 7, 1, 1),
  (9, "Audit Logs", "/audit-logs", "reports", "audit_logs", 7, 2, 1)
ON DUPLICATE KEY UPDATE label=VALUES(label), path=VALUES(path), icon=VALUES(icon), page_key=VALUES(page_key), parent_id=VALUES(parent_id);
