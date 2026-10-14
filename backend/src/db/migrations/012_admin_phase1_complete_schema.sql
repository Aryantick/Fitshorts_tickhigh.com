-- ===================================================
-- Fitness Reels Platform — Migration 012
-- Admin Portal Phase 1 Complete Schema
-- ===================================================

-- 1. Create Categories Master Table
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  icon_url VARCHAR(255) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_active_order (is_active, display_order)
);

-- Seed Default Wellness Categories
INSERT INTO categories (name, slug, description, display_order, is_active)
VALUES 
  ('Exercise', 'exercise', 'General workout and training sessions', 1, 1),
  ('Yoga', 'yoga', 'Yoga postures, flows, and flexibility practices', 2, 1),
  ('Meditation', 'meditation', 'Mindfulness and guided relaxation techniques', 3, 1),
  ('Zumba', 'zumba', 'Cardio dance workouts and rhythmic routines', 4, 1),
  ('Breathing', 'breathing', 'Breathwork, pranayama, and stress reduction', 5, 1),
  ('Fitness Tips', 'fitness-tips', 'Quick health advice, posture tips, and workout hacks', 6, 1),
  ('Healthy Recipes', 'healthy-recipes', 'Nutritious meal plans, diet ideas, and smoothies', 7, 1),
  ('Wellness Tips', 'wellness-tips', 'Holistic wellness, sleep hygiene, and recovery tips', 8, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), display_order=VALUES(display_order);

-- 2. Create Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT NOT NULL,
  admin_username VARCHAR(100) NULL,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id BIGINT NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_admin (admin_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_target (target_type, target_id),
  INDEX idx_audit_created (created_at)
);
