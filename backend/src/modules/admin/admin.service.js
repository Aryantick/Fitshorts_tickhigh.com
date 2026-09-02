const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminRepository = require("./admin.repository");
const JwtConfig = require("../../config/jwt.config");
const S3Client = require("../../integrations/s3/s3.client");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { pool } = require("../../config/db.config");
const NotifactionService = require("../notifications/notifications.service")
const ReelRepository = require("../reels/reels.repository")
const MusicService = require("../music/music.service");

async function loginAdmin(identifier, password) {
  try {
    const admin = await AdminRepository.findAdminByUsernameOrEmail(identifier);

    if (!admin) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      {
        adminId: admin.id,
        role: admin.role,
      },
      JwtConfig.adminAccessSecret,
      { expiresIn: "1h" },
    );

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    };
  } catch (error) {
    console.error("loginAdmin error:", error.message);
    throw error;
  }
}
async function createModerator(username, email, password) {
  try {
    const existing = await AdminRepository.findAdminByUsernameOrEmail(username);
    const existingByEmail =
      await AdminRepository.findAdminByUsernameOrEmail(email);

    if (existing || existingByEmail) {
      throw new Error("Username or email already in use");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await AdminRepository.CreatedAdmins(
      username,
      email,
      passwordHash,
      "moderator",
    );

    return {
      id: result.insertId,
      username,
      email,
      role: "moderator",
    };
  } catch (error) {
    console.error("createModerator error:", error.message);
    throw error;
  }
}

//getPendingReels
async function getPendingReels() {
  try {
    const result = await AdminRepository.findPendingReels();
    const reelsWithUrls = await Promise.all(
      result.map(async (reel) => {
        const videoKey = reel.raw_s3_key || reel.hls_s3_key;
        let videoUrl = null;

        if (videoKey) {
          videoUrl = await getSignedUrl(
            S3Client.s3Client,
            new GetObjectCommand({
              Bucket: S3Client.bucketName,
              Key: videoKey,
            }),
            { expiresIn: 3600 }
          );
        }

        let musicUrl = null;
        let musicTitle = null;
        let musicArtist = null;

        if (reel.music_id) {
          try {
            const musicTrack = await MusicService.getMusicById(reel.music_id);
            if (musicTrack && musicTrack.s3_key) {
              musicUrl = await getSignedUrl(
                S3Client.s3Client,
                new GetObjectCommand({
                  Bucket: S3Client.bucketName,
                  Key: musicTrack.s3_key,
                }),
                { expiresIn: 3600 }
              );
              musicTitle = musicTrack.title;
              musicArtist = musicTrack.artist;
            }
          } catch (musicErr) {
            console.warn("Failed to attach music audioUrl in admin service:", musicErr.message);
          }
        }

        return {
          ...reel,
          videoUrl,
          music_url: musicUrl,
          music_title: musicTitle,
          music_artist: musicArtist,
        };
      })
    );

    return reelsWithUrls;
  } catch (error) {
    console.log("getPendingReels error", error.message);
    throw error;
  }
}


//approveReel
async function approveReel(id, adminId) {
  try {
    const reel = await ReelRepository.findReelById(id);
    if (!reel) {
      throw new Error("Reel not found");
    }

    const result = await AdminRepository.approveReel(id, adminId);

    try {
      await NotifactionService.createNotification(
        reel.user_id,
        id,
        "reel_approved",
        `Your reel ${reel.title} has been approved and is now live`,
        reel.client_id || 1,
      );
    } catch (notificationError) {
      console.error("Failed to send reel approval notification", notificationError);
    }

    return result;
  } catch (error) {
    console.error("approveReel error:", error.message);
    throw error;
  }
}

async function rejectedReel(id, adminId, reason) {
  try {
    const reel = await ReelRepository.findReelById(id);
    if (!reel) {
      throw new Error("Reel not found");
    }

    const result = await AdminRepository.rejectReel(id, adminId, reason);

    try {
      await NotifactionService.createNotification(
        reel.user_id,
        id,
        "reel_rejected",
        `Your reel ${reel.title} was rejected. Reason: ${reason}`,
        reel.client_id || 1,
      );
    } catch (notificationError) {
      console.error("Failed to send reel rejected notification", notificationError);
    }

    return result;
  } catch (error) {
    console.log("rejected reel", error.message);
    throw error;
  }
}

async function deleteReel(id, adminId, reason) {
  try {
    const reel = await ReelRepository.findReelById(id);
    if (!reel) {
      throw new Error("Reel not found");
    }

    const result = await AdminRepository.deleteReel(id, adminId, reason);

    try {
      await NotifactionService.createNotification(
        reel.user_id,
        id,
        "reel_deleted",
        `Your reel ${reel.title} was deleted. Reason: ${reason}`,
        reel.client_id || 1,
      );
    } catch (notificationError) {
      console.error("Failed to send reel deleted notification", notificationError);
    }

    return result;
  } catch (error) {
    console.error("deleteReel error:", error.message);
    throw error;
  }
}


module.exports = {
  loginAdmin,
  createModerator,
  getPendingReels,
  approveReel,
  rejectedReel,
  deleteReel
};
