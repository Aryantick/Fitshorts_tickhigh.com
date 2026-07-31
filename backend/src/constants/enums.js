/**
 * Fitness Reels Platform — Centralized Application Enums
 */

const ADMIN_ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  MODERATOR: "moderator",
  ADMIN: "admin",
});

const REEL_STATUS = Object.freeze({
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  PUBLISHED: "published",
  DELETED: "deleted",
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
  SUBSCRIPTION_RENEWED: "subscription_renewed",
});

module.exports = {
  ADMIN_ROLES,
  REEL_STATUS,
  TRANSCODING_STATUS,
  REEL_CATEGORIES,
  NOTIFICATION_TYPES,
};
