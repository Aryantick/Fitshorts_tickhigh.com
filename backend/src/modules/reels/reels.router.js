const router = require("express").Router();
const reelsController = require("./reels.controller");
const authenticateUser = require("../../middlewares/auth.middlewares");

router.get("/reels/upload-url", authenticateUser, reelsController.getUploadUrl);
router.post("/reels", authenticateUser, reelsController.uploadReel);
router.get("/reels/feed", authenticateUser, reelsController.getFeed);
router.get("/reels/my-reels", authenticateUser, reelsController.getMyReels);   
router.get("/reels/:id", authenticateUser, reelsController.getReelById);      
router.post("/reels/:id/like", authenticateUser, reelsController.reelLike);
router.delete("/reels/:id/delete", authenticateUser, reelsController.deleteReel);
router.delete("/reels/:id/like", authenticateUser, reelsController.unlikeReel);
router.post("/reels/:id/view", authenticateUser, reelsController.recordView);
router.patch("/reels/:id", authenticateUser, reelsController.updateReelMetadata);
module.exports = router;