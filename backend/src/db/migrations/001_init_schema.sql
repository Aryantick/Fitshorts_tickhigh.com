-- ===================================================
-- Fitness Reels Platform — Initial Schema
-- Run this once to create all tables
-- ===================================================

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  msisdn VARCHAR(20) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  avatar_key VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE admins (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plans (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sub_service_id VARCHAR(50) NOT NULL UNIQUE,   -- e.g. HDaily, HWeekly
  display_name VARCHAR(100),
  price DECIMAL(10,2),
  validity_days SMALLINT,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_subscriptions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  sub_service_id VARCHAR(50),
  current_status VARCHAR(30),        -- new, unsub, pending, grace, parking, active, demo
  subscription_status VARCHAR(20),   -- active, inactive
  sub_time_left VARCHAR(20),
  sub_type VARCHAR(20),
  engine_transaction_id VARCHAR(50),
  last_checked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_sub (user_id)
);

CREATE TABLE otp_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  msisdn VARCHAR(20) NOT NULL,
  flow_type ENUM('subscribe', 'auth') NOT NULL,
  transaction_id VARCHAR(50),
  status ENUM('sent', 'verified', 'expired', 'failed') DEFAULT 'sent',
  response_code VARCHAR(10),
  attempt_count TINYINT DEFAULT 0,
  expires_at DATETIME,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_msisdn (msisdn)
);

CREATE TABLE refresh_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  device_id VARCHAR(100),
  ip_address VARCHAR(45),
  is_revoked TINYINT(1) DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_revoked (user_id, is_revoked, expires_at)
);

CREATE TABLE reels (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(150),
  description VARCHAR(500),
  raw_s3_key VARCHAR(255),
  hls_s3_key VARCHAR(255),
  thumb_s3_key VARCHAR(255),
  duration_sec SMALLINT,
  status ENUM('pending_review','approved','rejected','published') DEFAULT 'pending_review',
  category VARCHAR(50),
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  reviewed_at DATETIME,
  reviewed_by BIGINT,
  reject_reason VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_user_reels (user_id)
);

CREATE TABLE reel_likes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reel_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_like (reel_id, user_id)
);

CREATE TABLE reel_views (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reel_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  watch_pct TINYINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reel_views (reel_id)
);

CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type VARCHAR(50),
  payload JSON,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_notif (user_id, is_read)
);

CREATE TABLE music_tracks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150),
  artist VARCHAR(150),
  source_type ENUM('licensed','user_upload') DEFAULT 'licensed',
  source_user_id BIGINT,
  source_reel_id BIGINT,
  s3_key VARCHAR(255),
  cover_thumb_key VARCHAR(255),
  duration_sec SMALLINT,
  usage_count BIGINT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (source_reel_id) REFERENCES reels(id) ON DELETE SET NULL
);

CREATE TABLE reel_audio (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reel_id BIGINT NOT NULL UNIQUE,
  music_track_id BIGINT,
  start_ms INT,
  end_ms INT,
  volume_pct TINYINT,
  original_audio_volume_pct TINYINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,
  FOREIGN KEY (music_track_id) REFERENCES music_tracks(id) ON DELETE SET NULL
);