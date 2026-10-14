/**
 * Fitness Reels Platform — Centralized Application Enums
 */

const ADMIN_ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  CONTENT_ADMIN: "content_admin",
  MODERATOR: "moderator",
  ANALYTICS_ADMIN: "analytics_admin",
  ADMIN: "admin",
});

const REEL_STATUS = Object.freeze({
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  PUBLISHED: "published",
  DELETED: "deleted",
  SUSPENDED: "suspended",
});

const TRANSCODING_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
});

const REEL_CATEGORIES = Object.freeze({
  WORKOUT: "workout",
  YOGA: "yoga",
  CARDIO: "cardio",
  STRENGTH: "strength",
  NUTRITION: "nutrition",
  MOTIVATION: "motivation",
  ZUMBA: "zumba",
  OTHER: "other",
});

const NOTIFICATION_TYPES = Object.freeze({
  REEL_LIKE: "reel_like",
  REEL_APPROVED: "reel_approved",
  REEL_REJECTED: "reel_rejected",
  REEL_SUSPENDED: "reel_suspended",
  SUBSCRIPTION_RENEWED: "subscription_renewed",
});

const REJECTION_REASONS = Object.freeze([
  "Inappropriate content",
  "Misleading health information",
  "Offensive content",
  "Copyright issue",
  "Poor video quality",
  "Duplicate content",
  "Wrong category",
  "Promotional/commercial content",
  "Not wellness related",
  "Unsafe exercise",
  "Other / Custom reason",
]);

const AUDIT_ACTIONS = Object.freeze({
  ADMIN_LOGIN: "admin_login",
  REEL_APPROVED: "reel_approved",
  REEL_REJECTED: "reel_rejected",
  REEL_SUSPENDED: "reel_suspended",
  REEL_DELETED: "reel_deleted",
  USER_BLOCKED: "user_blocked",
  USER_UNBLOCKED: "user_unblocked",
  CATEGORY_CREATED: "category_created",
  CATEGORY_UPDATED: "category_updated",
  MUSIC_BULK_UPLOAD: "music_bulk_upload",
});

module.exports = {
  ADMIN_ROLES,
  REEL_STATUS,
  TRANSCODING_STATUS,
  REEL_CATEGORIES,
  NOTIFICATION_TYPES,
  REJECTION_REASONS,
  AUDIT_ACTIONS,
};
