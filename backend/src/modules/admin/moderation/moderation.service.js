const ModerationRepository = require("./moderation.repository");
const AuditRepository = require("../audit/audit.repository");
const ReelRepository = require("../../reels/reels.repository");
const NotificationService = require("../../notifications/notifications.service");
const S3Client = require("../../../integrations/s3/s3.client");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { REJECTION_REASONS, AUDIT_ACTIONS } = require("../../../constants/enums");

async function signS3Url(key, expiresIn = 3600) {
  if (!key) return null;
  try {
    return await getSignedUrl(
      S3Client.s3Client,
      new GetObjectCommand({
        Bucket: S3Client.bucketName,
        Key: key,
      }),
      { expiresIn }
    );
  } catch (err) {
    console.warn(`[S3 Sign Warning] Failed to sign key ${key}:`, err.message);
    return null;
  }
}

async function getReelsList(filters) {
  const result = await ModerationRepository.findReels(filters);

  // Attach signed S3 URLs for preview thumbnails and video streams
  const reelsWithUrls = await Promise.all(
    result.reels.map(async (reel) => {
      const videoKey = reel.raw_s3_key || reel.hls_s3_key;
      const [thumbUrl, videoUrl] = await Promise.all([
        signS3Url(reel.thumb_s3_key, 3600),
        signS3Url(videoKey, 3600),
      ]);

      return {
        ...reel,
        thumb_url: thumbUrl,
        video_url: videoUrl,
      };
    })
  );

  return {
    ...result,
    reels: reelsWithUrls,
  };
}

async function getReelDetails(id) {
  const reel = await ModerationRepository.findReelDetailsById(id);
  if (!reel) {
    throw new Error("Reel not found");
  }

  const videoKey = reel.raw_s3_key || reel.hls_s3_key;
  const [thumbUrl, videoUrl, musicUrl] = await Promise.all([
    signS3Url(reel.thumb_s3_key, 7200),
    signS3Url(videoKey, 7200),
    signS3Url(reel.music_s3_key, 7200),
  ]);

  return {
    ...reel,
    thumb_url: thumbUrl,
    video_url: videoUrl,
    music_url: musicUrl,
  };
}

async function approveReel(id, adminId, adminUsername = null, ipAddress = null) {
  const reel = await ReelRepository.findReelById(id);
  if (!reel) {
    throw new Error("Reel not found");
  }

  const result = await ModerationRepository.approveReel(id, adminId);

  // Send user push/in-app notification
  try {
    await NotificationService.createNotification(
      reel.user_id,
      id,
      "reel_approved",
      `Your reel "${reel.title || "Fitness Clip"}" has been approved and is now live!`,
      reel.client_id || 1
    );
  } catch (notificationError) {
    console.error("Failed to send reel approval notification:", notificationError.message);
  }

  // Record audit log
  try {
    await AuditRepository.createAuditLog({
      adminId,
      adminUsername,
      action: AUDIT_ACTIONS.REEL_APPROVED,
      targetType: "reel",
      targetId: id,
      details: { title: reel.title, creatorId: reel.user_id, clientId: reel.client_id },
      ipAddress,
    });
  } catch (err) {
    console.warn("Audit log error:", err.message);
  }

  return result;
}

async function rejectReel(id, adminId, reason, adminUsername = null, ipAddress = null) {
  const reel = await ReelRepository.findReelById(id);
  if (!reel) {
    throw new Error("Reel not found");
  }

  const result = await ModerationRepository.rejectReel(id, adminId, reason);

  // Send user push/in-app notification with standardized reason
  try {
    await NotificationService.createNotification(
      reel.user_id,
      id,
      "reel_rejected",
      `Your reel "${reel.title || "Fitness Clip"}" was rejected. Reason: ${reason}`,
      reel.client_id || 1
    );
  } catch (notificationError) {
    console.error("Failed to send reel rejection notification:", notificationError.message);
  }

  // Record audit log
  try {
    await AuditRepository.createAuditLog({
      adminId,
      adminUsername,
      action: AUDIT_ACTIONS.REEL_REJECTED,
      targetType: "reel",
      targetId: id,
      details: { title: reel.title, reason, creatorId: reel.user_id, clientId: reel.client_id },
      ipAddress,
    });
  } catch (err) {
    console.warn("Audit log error:", err.message);
  }

  return result;
}

async function suspendReel(id, adminId, reason, adminUsername = null, ipAddress = null) {
  const reel = await ReelRepository.findReelById(id);
  if (!reel) {
    throw new Error("Reel not found");
  }

  const result = await ModerationRepository.suspendReel(id, adminId, reason);

  try {
    await NotificationService.createNotification(
      reel.user_id,
      id,
      "reel_suspended",
      `Your reel "${reel.title || "Fitness Clip"}" has been suspended. Reason: ${reason}`,
      reel.client_id || 1
    );
  } catch (notificationError) {
    console.error("Failed to send reel suspension notification:", notificationError.message);
  }

  try {
    await AuditRepository.createAuditLog({
      adminId,
      adminUsername,
      action: AUDIT_ACTIONS.REEL_SUSPENDED,
      targetType: "reel",
      targetId: id,
      details: { title: reel.title, reason, creatorId: reel.user_id },
      ipAddress,
    });
  } catch (err) {
    console.warn("Audit log error:", err.message);
  }

  return result;
}

async function deleteReel(id, adminId, reason, adminUsername = null, ipAddress = null) {
  const reel = await ReelRepository.findReelById(id);
  if (!reel) {
    throw new Error("Reel not found");
  }

  const result = await ModerationRepository.deleteReel(id, adminId, reason);

  try {
    await AuditRepository.createAuditLog({
      adminId,
      adminUsername,
      action: AUDIT_ACTIONS.REEL_DELETED,
      targetType: "reel",
      targetId: id,
      details: { title: reel.title, reason, creatorId: reel.user_id },
      ipAddress,
    });
  } catch (err) {
    console.warn("Audit log error:", err.message);
  }

  return result;
}

function getRejectionReasons() {
  return REJECTION_REASONS;
}

module.exports = {
  getReelsList,
  getReelDetails,
  approveReel,
  rejectReel,
  suspendReel,
  deleteReel,
  getRejectionReasons,
};
