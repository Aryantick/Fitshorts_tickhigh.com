const router = require("express").Router();
const reelsController = require("./reels.controller");
const authenticateUser = require("../../middlewares/auth.middlewares");
const validate = require("../../middlewares/validate.middleware");
const {
  uploadReelSchema,
  updateReelMetadataSchema,
  reelIdParamSchema,
} = require("../../validations/reels.validation");

router.get("/reels/upload-url", authenticateUser, reelsController.getUploadUrl);
router.post("/reels/upload", authenticateUser, validate(uploadReelSchema), reelsController.uploadReel);
router.post("/reels", authenticateUser, validate(uploadReelSchema), reelsController.uploadReel);
router.get("/reels/feed", authenticateUser, reelsController.getFeed);
router.get("/reels/my-reels", authenticateUser, reelsController.getMyReels);   
router.get("/reels/:id", authenticateUser, validate(reelIdParamSchema), reelsController.getReelById);      
router.post("/reels/:id/like", authenticateUser, validate(reelIdParamSchema), reelsController.reelLike);
router.delete("/reels/:id/delete", authenticateUser, validate(reelIdParamSchema), reelsController.deleteReel);
router.delete("/reels/:id/like", authenticateUser, validate(reelIdParamSchema), reelsController.unlikeReel);
router.post("/reels/:id/view", authenticateUser, validate(reelIdParamSchema), reelsController.recordView);
router.patch("/reels/:id", authenticateUser, validate(updateReelMetadataSchema), reelsController.updateReelMetadata);
module.exports = router;