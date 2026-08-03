const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const s3Config = require("../../config/s3.config");
const fs = require("fs");

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

//generateAudioUrl
async function generateAudioUrl(adminId, fileExtension) {
  const key = `music/${adminId}/${uuidv4()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: s3Config.bucketName,
    Key: key,
    ContentType: `audio/${fileExtension}`,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 1200,
  });

  return { uploadUrl, key };
}

//downloadFile
async function downloadFile(key, localPath) {
  const command = new GetObjectCommand({
    Bucket: s3Config.bucketName,
    Key: key,
  });
  const response = await s3Client.send(command);
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(localPath);
    response.Body.pipe(writeStream)
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  })

}
async function uploadFile(localPath, key, contentType) {
  const fileStream = fs.createReadStream(localPath);
  const command = new PutObjectCommand({
    Bucket: s3Config.bucketName,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
  });
  await s3Client.send(command);
  return key;
}

///deleteFile
async function deleteFile(key) {
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
  const command = new DeleteObjectCommand({
    Bucket: s3Config.bucketName,
    Key: key,
  });
  await s3Client.send(command);
  return key;
}

module.exports = {
  s3Client,
  bucketName: s3Config.bucketName,
  generateUploadUrl,
  generateAudioUrl,
  downloadFile,
  uploadFile,
  deleteFile,
};