-- ===================================================
-- Fitness Reels Platform — Migration 005
-- Add client_id to notifications for Multi-Tenant Support
-- ===================================================

ALTER TABLE notifications ADD COLUMN client_id BIGINT NULL AFTER user_id;
ALTER TABLE notifications ADD INDEX idx_notifications_client_user (client_id, user_id);
