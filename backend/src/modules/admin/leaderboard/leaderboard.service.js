const LeaderboardRepository = require("./leaderboard.repository");
const S3Client = require("../../../integrations/s3/s3.client");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");

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

async function getLeaderboard({ period = "all_time", clientId = null, limit = 20 }) {
  const result = await LeaderboardRepository.getLeaderboard({ period, clientId, limit });

  // Attach signed thumbnails for top reels
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

module.exports = {
  getLeaderboard,
};
