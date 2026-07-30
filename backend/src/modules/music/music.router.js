const router = require("express").Router();
const MusicController = require("./music.controller");
const authenticateAdmin = require("../../middlewares/authenticateAdmin");
const requireSuperAdmin = require("../../middlewares/requireSuperAdmin");
const authenticateUser = require("../../middlewares/auth.middlewares");

router.post(
    "/admin/music/upload-url",
    authenticateAdmin,
    requireSuperAdmin,
    MusicController.getUploadUrl,
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
)



router.get("/music", authenticateUser, MusicController.getAllMusic);

router.get(
    "/music/trending", authenticateUser, MusicController.getTrendingMusic
)
module.exports = router;