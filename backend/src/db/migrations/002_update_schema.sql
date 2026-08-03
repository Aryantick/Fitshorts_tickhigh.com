-- ===================================================
-- Fitness Reels Platform — Migration 002
-- Add missing columns and align database schema with repositories
-- ===================================================

-- 1. Admins Table Updates
ALTER TABLE admins ADD COLUMN username VARCHAR(100) AFTER id;
ALTER TABLE admins ADD COLUMN role VARCHAR(50) DEFAULT 'admin' AFTER password_hash;

-- 2. Reels Table Updates
ALTER TABLE reels ADD COLUMN transcoding_status VARCHAR(50) DEFAULT 'pending' AFTER status;
ALTER TABLE reels ADD COLUMN rejection_reason VARCHAR(255) AFTER reviewed_by;

-- 3. Reel Views Table Updates
ALTER TABLE reel_views ADD COLUMN watch_duration INT AFTER user_id;

-- 4. Notifications Table Updates
ALTER TABLE notifications ADD COLUMN reel_id BIGINT AFTER user_id;
ALTER TABLE notifications ADD COLUMN message TEXT AFTER type;

-- 5. Music Tracks Table Updates
ALTER TABLE music_tracks ADD COLUMN category VARCHAR(50) AFTER duration_sec;
