CREATE TABLE reels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(499) NOT NULL,
    category_id BIGINT UNSIGNED NULL ,
    music_id BIGINT UNSIGNED NULL,
    status ENUM(
        'pending_review',
        "approved",
        'rejected',
        'published'
        'delete'
    ) NOT NULL DEFAULT 'pending_review' , 
   transcoding_status ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
   ) DEFAULT 'pending' ,
   view_count BIGINT UNSIGNED NOT NULL DEFAULT 0 ,
   like_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   
   INDEX idx_reels_user_id(user_id)
   INDEX idx_reels_client_id(client_id)
   INDEX idx_reels_category_id(category_id)
   INDEX idx_reels_status(status)
)



CREATE TABLE reel_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reel_id BIGINT UNSIGNED NOT NULL,
    raw_s3_key VARCHAR(150) NULL,
    hls_s3_key VARCHAR(150) NULL,
    thumb_s3_key VARCHAR(150) NULL,
    duration_sec DECIMAL (10, 2) NULL,
    transcoding_status ENUM (
        'pending',
        'processing',
        'completed',
        'failed'
    ) DEFAULT 'pending' ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reel_media_reel_id (reel_id)
  INDEX idx_reel_media_reel_id(reel_id)
  CONSTRAINT fk_reel_media_reel FOREIGN KEY (reel_id) REFERENCES reels(id)
    
)


CREATE TABLE reel_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    reel_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    watch_pct TINYINT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reel_id)
        REFERENCES reels(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_reel_views_reel_id (reel_id),
    INDEX idx_reel_views_user_id (user_id)
);