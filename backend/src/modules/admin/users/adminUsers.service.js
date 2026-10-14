const AdminUsersRepository = require("./adminUsers.repository");
const AuditRepository = require("../audit/audit.repository");
const S3Client = require("../../../integrations/s3/s3.client");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { AUDIT_ACTIONS } = require("../../../constants/enums");

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
    return null;
  }
}

async function getUsersList(filters) {
  return await AdminUsersRepository.findUsers(filters);
}

async function getUserDetails(id) {
  const user = await AdminUsersRepository.findUserDetailsById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

async function getUserReels(userId, page = 1, limit = 10) {
  const result = await AdminUsersRepository.findUserUploadedReels(userId, page, limit);

  const reelsWithThumb = await Promise.all(
    result.reels.map(async (reel) => {
      const thumbUrl = await signS3Url(reel.thumb_s3_key, 3600);
      return {
        ...reel,
        thumb_url: thumbUrl,
      };
    })
  );

  return {
    ...result,
    reels: reelsWithThumb,
  };
}

async function setUserBlockStatus(userId, isBlocked, reason, adminId, adminUsername = null, ipAddress = null) {
  const user = await AdminUsersRepository.findUserDetailsById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  await AdminUsersRepository.updateUserBlockStatus(userId, isBlocked, reason);

  try {
    await AuditRepository.createAuditLog({
      adminId,
      adminUsername,
      action: isBlocked ? AUDIT_ACTIONS.USER_BLOCKED : AUDIT_ACTIONS.USER_UNBLOCKED,
      targetType: "user",
      targetId: userId,
      details: { msisdn: user.msisdn, isBlocked, reason },
      ipAddress,
    });
  } catch (err) {
    console.warn("Audit log error:", err.message);
  }

  return {
    success: true,
    message: isBlocked ? `User ${user.msisdn} blocked successfully` : `User ${user.msisdn} reactivated successfully`,
  };
}

module.exports = {
  getUsersList,
  getUserDetails,
  getUserReels,
  setUserBlockStatus,
};
