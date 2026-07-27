const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const s3Config = require("../../config/s3.config");

const s3Client = new S3Client({
  region: s3Config.region,
  credentials: {
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
  },
});

async function generateUploadUrl(userId, fileExtension) {
  const key = `uploads/${userId}/${uuidv4()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: s3Config.bucketName,
    Key: key,
    ContentType: `video/${fileExtension}`,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 1200,
  });

  return { uploadUrl, key };
}

module.exports = {
  s3Client,
  bucketName: s3Config.bucketName,
  generateUploadUrl,
};