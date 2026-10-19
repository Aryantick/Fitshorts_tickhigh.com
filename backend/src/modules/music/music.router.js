const router = require("express").Router();
const MusicController = require("./music.controller");
const authenticateAdmin = require("../../middlewares/authenticateAdmin");
const requireSuperAdmin = require("../../middlewares/requireSuperAdmin");
const authenticateUser = require("../../middlewares/auth.middlewares");

// ==========================================
// SUPER ADMIN MUSIC ENDPOINTS (SUPER ADMIN ONLY)
// ==========================================
router.post(
    "/admin/music/upload-url",
    authenticateAdmin,
    requireSuperAdmin,
    MusicController.getUploadUrl,
);

router.post(
    "/admin/music/batch-upload-urls",
    authenticateAdmin,
    requireSuperAdmin,
    MusicController.getBatchUploadUrls,
);

router.post(
    "/admin/music",
    authenticateAdmin,
    requireSuperAdmin,
    MusicController.createMusic,
);

router.get(
    "/admin/music/categories",
    authenticateAdmin,
    requireSuperAdmin,
    MusicController.musicCategories
);

router.get(
    "/admin/music",
    authenticateAdmin,
    requireSuperAdmin,
    MusicController.getAllMusic
);

router.get(
    "/admin/music/:id",
    authenticateAdmin,
    requireSuperAdmin,
    MusicController.getMusicById
);

router.delete(
    "/admin/music/:id",
    authenticateAdmin,
    requireSuperAdmin,
    MusicController.deleteMusic
);

router.delete(
    "/music/:id",
    authenticateAdmin,
    requireSuperAdmin,
    MusicController.deleteMusic
);


// ==========================================
// USER / MOBILE APP MUSIC ENDPOINTS
// ==========================================
router.get("/music/categories", authenticateUser, MusicController.musicCategories);
router.get("/music", authenticateUser, MusicController.getAllMusic);
router.get("/music/trending", authenticateUser, MusicController.getTrendingMusic);

module.exports = router;