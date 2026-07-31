-- ===================================================
-- Fitness Reels Platform — Migration 002
-- Add missing columns and align database schema with repositories
-- ===================================================

-- 1. Admins Table Updates
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS username VARCHAR(100) AFTER id,
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin' AFTER password_hash;

-- 2. Reels Table Updates
ALTER TABLE reels
  ADD COLUMN IF NOT EXISTS transcoding_status VARCHAR(50) DEFAULT 'pending' AFTER status,
  ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(255) AFTER reviewed_by;

-- 3. Reel Views Table Updates
ALTER TABLE reel_views
  ADD COLUMN IF NOT EXISTS watch_duration INT AFTER user_id;

-- 4. Notifications Table Updates
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS reel_id BIGINT AFTER user_id,
  ADD COLUMN IF NOT EXISTS message TEXT AFTER type;

-- Add foreign key constraint if not already present
-- Note: If constraint already exists, MySQL will ignore or you can run safely
ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_reel 
  FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE;

-- 5. Music Tracks Table Updates
ALTER TABLE music_tracks
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) AFTER duration_sec;
