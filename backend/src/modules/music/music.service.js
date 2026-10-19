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
async function getMusicById(musicId) {
  try {
    return await MusicRepository.findMusicById(musicId);
  } catch (error) {
    console.error("getMusicById error:", error.message);
    return null;
  }
}

async function getBatchUploadUrls(adminId, fileList) {
  try {
    const results = await Promise.all(
      fileList.map(async (item) => {
        const rawExt = item.fileExtension || (item.fileName ? item.fileName.split(".").pop() : "mp3");
        const cleanExt = String(rawExt).trim().toLowerCase().replace(/^\./, "") || "mp3";
        const { uploadUrl, key } = await S3Client.generateAudioUrl(adminId, cleanExt);
        return {
          fileName: item.fileName || `audio.${cleanExt}`,
          fileExtension: cleanExt,
          uploadUrl,
          key,
        };
      })
    );
    return results;
  } catch (error) {
    console.error("getBatchUploadUrls error:", error.message);
    throw new Error("Failed to generate batch upload URLs");
  }
}

async function deleteMusic(musicId, adminId = null, adminUsername = null, ipAddress = null) {
  try {
    const track = await MusicRepository.findMusicById(musicId);
    if (!track) {
      throw new Error("Music track not found");
    }

    if (track.s3_key) {
      try {
        await S3Client.deleteFile(track.s3_key);
      } catch (s3Err) {
        console.warn("Could not delete S3 audio file:", s3Err.message);
      }
    }

    const deleted = await MusicRepository.deleteMusicById(musicId);

    if (adminId) {
      try {
        const AuditRepository = require("../admin/audit/audit.repository");
        const { AUDIT_ACTIONS } = require("../../constants/enums");
        await AuditRepository.createAuditLog({
          adminId,
          adminUsername,
          action: AUDIT_ACTIONS.MUSIC_DELETED || "music_deleted",
          targetType: "music",
          targetId: musicId,
          details: { title: track.title, artist: track.artist, s3Key: track.s3_key },
          ipAddress,
        });
      } catch (auditErr) {
        // silent fail on audit log
      }
    }

    return { deleted, id: musicId, title: track.title };
  } catch (error) {
    console.error("deleteMusic error:", error.message);
    throw error;
  }
}

module.exports = {
    getUploadUrlMusic,
    getBatchUploadUrls,
    createMusic,
    musicCategories,
    getAllMusic,
    incrementUsageCount,
    getTrendingMusic,
    getMusicById,
    deleteMusic,
};