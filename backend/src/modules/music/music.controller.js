const MusicService = require("./music.service")
const apiResponse = require("../../utils/apiResponse")



async function getUploadUrl(req, res) {
    try {
        const { fileExtension } = req.query;
        if (!fileExtension) {
            return apiResponse(res, 400, "fileExtension are requird")
        }
        const adminId = req.admin.adminId
        const result = await MusicService.getUploadUrlMusic(adminId, fileExtension)
        return apiResponse(res, 200, "Music upload URL generated", result)
    } catch (error) {
        return apiResponse(res, 400, error.message, error)
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


module.exports = {
    getUploadUrl,
    createMusic,
    musicCategories,
    getAllMusic,
    getTrendingMusic
}