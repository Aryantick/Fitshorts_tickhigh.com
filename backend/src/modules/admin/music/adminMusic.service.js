const AdminMusicRepository = require("./adminMusic.repository");
const AuditRepository = require("../audit/audit.repository");
const { AUDIT_ACTIONS } = require("../../../constants/enums");

async function bulkUploadMusic(tracks, adminId, adminUsername = null, ipAddress = null) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new Error("Tracks array is required and cannot be empty");
  }

  const enrichedTracks = tracks.map((t) => ({
    ...t,
    adminId,
  }));

  const result = await AdminMusicRepository.createBulkMusicTracks(enrichedTracks);

  try {
    await AuditRepository.createAuditLog({
      adminId,
      adminUsername,
      action: AUDIT_ACTIONS.MUSIC_BULK_UPLOAD,
      targetType: "music",
      details: { count: result.insertedCount, trackTitles: tracks.map((t) => t.title) },
      ipAddress,
    });
  } catch (err) {}

  return result;
}

module.exports = {
  bulkUploadMusic,
};
