const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminRepository = require("./admin.repository");
const JwtConfig = require("../../config/jwt.config");
const S3Client = require("../../integrations/s3/s3.client");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { pool } = require("../../config/db.config");

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
async function getPendingReels() {
  try {
    const result = await AdminRepository.findPendingReels();
    const reelsWithUrls = await Promise.all(
      result.map(async (reel) => {
        const videoKey = reel.hls_s3_key || reel.raw_s3_key;

        const videoUrl = await getSignedUrl(
          S3Client.s3Client,
          new GetObjectCommand({
            Bucket: S3Client.bucketName,
            Key: videoKey,
          }),
          { expiresIn: 3600 },
        );

        return { ...reel, videoUrl };
      }),
    );

    return reelsWithUrls;
  } catch (error) {
    console.log("getPendingReels error", error.message);
    throw error;
  }
}



async function approveReel(id,adminId) {
  try {
    const result =  await AdminRepository.approveReel(id, adminId)
    return result
  } catch (error) {
    console.log("approve reel", error.message)
  }
}
async function rejectedReel(id, adminId, reason) {
  try {
    const result = await AdminRepository.rejectReel(id, adminId, reason);
    return result;
  } catch (error) {
    console.log("rejected reel", error.message);
    throw error;   
  }
}

async function deleteReel(id, adminId, reason) {
  try {
    const result = await AdminRepository.deleteReel(id, adminId, reason);
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
