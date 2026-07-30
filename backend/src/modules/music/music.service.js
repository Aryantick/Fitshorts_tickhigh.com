const S3Client = require("../../integrations/s3/s3.client");
const MusicRepository = require("./music.repository");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const MUSIC_CATEGORIES = require("../../constants/musicCategories")


//getUploadUrlMusic
async function getUploadUrlMusic(adminId, fileExtension) {
    try {
        const result = await S3Client.generateAudioUrl(adminId, fileExtension)
        return result;
    } catch (error) {
        console.error("uplode url not genrated", error)
        throw new Error
    }
}
//createMusic
async function createMusic(title, artist, s3Key, durationSec, adminId, category) {
    try {
        const result = await MusicRepository.CreateMusic(
            title,
            artist,
            s3Key,
            durationSec,
            adminId,
            category
        );
        return result;
    } catch (error) {
        console.error("createMusic error:", error.message);
        throw error;
    }
}
//musicCategories
async function musicCategories() {
    try {
        return MUSIC_CATEGORIES
    } catch (error) {
        console.error("getCategories error:", error.message);
        throw error;
    }
}
//getAllMusic
async function getAllMusic(category) {
    try {

        const tracks = category ? await MusicRepository.findMusicByCategory(category) : await MusicRepository.findbyMusic();
        const tracksWithUrls = await Promise.all(
            tracks.map(async (track) => {
                const audioUrl = await getSignedUrl(
                    S3Client.s3Client,
                    new GetObjectCommand({
                        Bucket: S3Client.bucketName,
                        Key: track.s3_key,
                    }),
                    { expiresIn: 3600 },
                );

                return { ...track, audioUrl };
            }),
        );

        return {
            categories: MUSIC_CATEGORIES,
            tracks: tracksWithUrls,
        };
    } catch (error) {
        console.error("getAllMusic error:", error.message);
        throw error;
    }
}
//incrementUsageCount
async function incrementUsageCount(musicId) {
  try {
    const result = await MusicRepository.incrementUsageCount(musicId);
    return result;
  } catch (error) {
    console.error("incrementUsageCount error:", error.message);
    throw error;
  }
}
async function getTrendingMusic() {
  try {
    const tracks = await MusicRepository.findTrandingMusic();

    const tracksWithUrls = await Promise.all(
      tracks.map(async (track) => {
        const audioUrl = await getSignedUrl(
          S3Client.s3Client,
          new GetObjectCommand({
            Bucket: S3Client.bucketName,
            Key: track.s3_key,
          }),
          { expiresIn: 3600 },
        );

        return { ...track, audioUrl };
      }),
    );

    return tracksWithUrls;
  } catch (error) {
    console.error("getTrendingMusic error:", error.message);
    throw error;
  }
}
module.exports = {
    getUploadUrlMusic,
    createMusic,
    musicCategories,
    getAllMusic,
    incrementUsageCount,
    getTrendingMusic
}