const MusicService = require("./music.service")
const apiResponse = require("../../utils/apiResponse")



async function getUploadUrl(req, res) {
    try {
        const fileExtension = req.body?.fileExtension || req.query?.fileExtension;
        if (!fileExtension) {
            return apiResponse(res, 400, "fileExtension is required (e.g. mp3, wav)");
        }
        const cleanExt = String(fileExtension).trim().toLowerCase().replace(/^\./, "");
        const adminId = req.admin?.adminId || 1;
        const result = await MusicService.getUploadUrlMusic(adminId, cleanExt);
        return apiResponse(res, 200, "Music upload URL generated", result);
    } catch (error) {
        return apiResponse(res, 400, error.message, error);
    }
}

async function getBatchUploadUrls(req, res) {
    try {
        const adminId = req.admin?.adminId || 1;
        const { files, count, fileExtension, extensions } = req.body;

        let fileList = [];

        if (Array.isArray(files) && files.length > 0) {
            fileList = files;
        } else if (Array.isArray(extensions) && extensions.length > 0) {
            fileList = extensions.map((ext, idx) => ({
                fileName: `track_${idx + 1}.${ext}`,
                fileExtension: ext,
            }));
        } else if (count && count > 0) {
            const targetCount = Math.min(Number(count), 5);
            const ext = fileExtension || "mp3";
            for (let i = 0; i < targetCount; i++) {
                fileList.push({
                    fileName: `track_${i + 1}.${ext}`,
                    fileExtension: ext,
                });
            }
        }

        if (fileList.length === 0) {
            return apiResponse(res, 400, "files array or count is required (max 5)");
        }

        if (fileList.length > 5) {
            return apiResponse(res, 400, "Maximum 5 files allowed for bulk upload at once");
        }

        const result = await MusicService.getBatchUploadUrls(adminId, fileList);
        return apiResponse(res, 200, "Batch upload URLs generated successfully", result);
    } catch (error) {
        return apiResponse(res, 400, error.message, error);
    }
}


//createMusic
async function createMusic(req, res) {
    try {
        const { title, artist, s3Key, durationSec, category } = req.body;

        if (!title || !artist || !category || !s3Key) {
            return apiResponse(res, 400, "title, artist, category & s3Key are required", null);
        }

        const adminId = req.admin.adminId;

        const result = await MusicService.createMusic(
            title,
            artist,
            s3Key,
            durationSec,
            adminId,
            category,
        );

        return apiResponse(res, 200, "Music created successfully", result);
    } catch (error) {
        return apiResponse(res, 400, error.message, error);
    }
}

//musicCategories

async function musicCategories(req, res) {
    try {
        const category = await MusicService.musicCategories()
        return apiResponse(res, 200, "Categories fetched successfully", category)
    } catch (error) {
        return apiResponse(res, 400, error.message, error)
    }
}



async function getAllMusic(req, res) {
    try {
        const { category } = req.query
        const result = await MusicService.getAllMusic(category)
        return apiResponse(res, 200, "All music fetched successfully", result)
    } catch (error) {
        return apiResponse(res, 400, error.message, error)
    }
}



async function getTrendingMusic(req, res) {
    try {
        const result = await MusicService.getTrendingMusic()
        return apiResponse(res, 200, "Trending music fetched successfully", result)
    } catch (error) {
        return apiResponse(res, 400, error.message, error)
    }
}

async function getMusicById(req, res) {
    try {
        const musicId = req.params.id;
        const track = await MusicService.getMusicById(musicId);
        if (!track) {
            return apiResponse(res, 404, "Music track not found", null);
        }
        return apiResponse(res, 200, "Music track fetched successfully", track);
    } catch (error) {
        return apiResponse(res, 400, error.message, null);
    }
}

async function deleteMusic(req, res) {
    try {
        const musicId = req.params.id;
        if (!musicId) {
            return apiResponse(res, 400, "Music track ID is required", null);
        }

        const adminId = req.admin?.adminId || null;
        const adminUsername = req.admin?.username || null;
        const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

        const result = await MusicService.deleteMusic(musicId, adminId, adminUsername, ipAddress);
        return apiResponse(res, 200, "Music track deleted successfully", result);
    } catch (error) {
        const statusCode = error.message === "Music track not found" ? 404 : 400;
        return apiResponse(res, statusCode, error.message, null);
    }
}

module.exports = {
    getUploadUrl,
    getBatchUploadUrls,
    createMusic,
    musicCategories,
    getAllMusic,
    getTrendingMusic,
    getMusicById,
    deleteMusic,
};