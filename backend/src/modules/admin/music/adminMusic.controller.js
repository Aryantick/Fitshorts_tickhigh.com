const AdminMusicService = require("./adminMusic.service");
const apiResponse = require("../../../utils/apiResponse");

async function bulkUploadMusic(req, res) {
  try {
    const { tracks } = req.body;
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return apiResponse(res, 400, "tracks array is required", null);
    }

    const adminId = req.admin.adminId;
    const adminUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await AdminMusicService.bulkUploadMusic(tracks, adminId, adminUsername, ipAddress);
    return apiResponse(res, 201, `Successfully imported ${result.insertedCount} music tracks`, result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

module.exports = {
  bulkUploadMusic,
};
