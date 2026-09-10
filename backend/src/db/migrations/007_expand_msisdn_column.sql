-- ===================================================
-- Fitness Reels Platform — Migration 007
-- Expand msisdn column length to support encrypted MSISDN tokens (80+ chars)
-- ===================================================

ALTER TABLE users MODIFY COLUMN msisdn VARCHAR(255) NOT NULL;
ALTER TABLE otp_requests MODIFY COLUMN msisdn VARCHAR(255) NOT NULL;
