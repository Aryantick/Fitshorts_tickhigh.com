-- ===================================================
-- Fitness Reels Platform — Migration 013
-- Dynamic Admin Roles, Client Scopes & Permissions
-- ===================================================

-- 1. Create admin_roles Table
CREATE TABLE IF NOT EXISTS admin_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id BIGINT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  permissions JSON NOT NULL,
  is_system_role TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_roles_client (client_id)
);

-- 2. Seed Default 5 System Standard Roles
INSERT INTO admin_roles (id, client_id, name, slug, description, permissions, is_system_role)
VALUES 
(
  1,
  NULL,
  'Super Admin',
  'super_admin',
  'Full administrative access across all clients and platform settings',
  '{"pages": ["*"], "actions": {"all": true, "canApproveReel": true, "canRejectReel": true, "canSuspendReel": true, "canBlockUser": true, "canManageCategories": true, "canManageAdmins": true, "canManageRoles": true, "canBulkUploadMusic": true, "isReadOnly": false}}',
  1
),
(
  2,
  NULL,
  'Content Admin',
  'content_admin',
  'Reel content moderation, category management, and feed review',
  '{"pages": ["dashboard", "moderation", "reels", "categories"], "actions": {"canApproveReel": true, "canRejectReel": true, "canSuspendReel": true, "canBlockUser": false, "canManageCategories": true, "canManageAdmins": false, "canManageRoles": false, "canBulkUploadMusic": false, "isReadOnly": false}}',
  1
),
(
  3,
  NULL,
  'Moderator',
  'moderator',
  'Review pending uploaded reels and approve or reject content',
  '{"pages": ["moderation", "reels"], "actions": {"canApproveReel": true, "canRejectReel": true, "canSuspendReel": false, "canBlockUser": false, "canManageCategories": false, "canManageAdmins": false, "canManageRoles": false, "canBulkUploadMusic": false, "isReadOnly": false}}',
  1
),
(
  4,
  NULL,
  'Analytics Admin',
  'analytics_admin',
  'Access to dashboards, performance reports, and leaderboard metrics',
  '{"pages": ["dashboard", "leaderboard"], "actions": {"canApproveReel": false, "canRejectReel": false, "canSuspendReel": false, "canBlockUser": false, "canManageCategories": false, "canManageAdmins": false, "canManageRoles": false, "canBulkUploadMusic": false, "isReadOnly": true}}',
  1
),
(
  5,
  NULL,
  'Viewer (Auditor)',
  'viewer',
  'Strictly read-only access to dashboard, reels, users, and audit logs',
  '{"pages": ["dashboard", "reels", "users", "audit_logs"], "actions": {"canApproveReel": false, "canRejectReel": false, "canSuspendReel": false, "canBlockUser": false, "canManageCategories": false, "canManageAdmins": false, "canManageRoles": false, "canBulkUploadMusic": false, "isReadOnly": true}}',
  1
)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  description = VALUES(description),
  permissions = VALUES(permissions),
  is_system_role = VALUES(is_system_role);
