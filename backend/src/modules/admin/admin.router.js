const router = require("express").Router();
const AdminController = require("./admin.controller");
const authenticateAdmin = require("../../middlewares/authenticateAdmin");
const requireSuperAdmin = require("../../middlewares/requireSuperAdmin");

router.post("/admin/login", AdminController.Login);
router.post(
  "/admin/create-moderator",
  authenticateAdmin,
  requireSuperAdmin,
  AdminController.createModerator,
);
router.get(
  "/admin/reel/pending",
  authenticateAdmin,
  AdminController.findPendingReel,
);
router.patch(
  "/admin/reels/:id/approve",
  authenticateAdmin,
  AdminController.approveReel,
);
router.patch(
  "/admin/reels/:id/reject",
  authenticateAdmin,
  AdminController.rejectedReel,
);
router.delete(
  "/admin/reels/:id/delete",
  authenticateAdmin,
  AdminController.deleteReel,
);
module.exports = router;
