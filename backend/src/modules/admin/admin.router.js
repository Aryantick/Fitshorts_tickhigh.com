const router = require("express").Router();
const AdminController = require("./admin.controller");
const authenticateAdmin = require("../../middlewares/authenticateAdmin");
const requireSuperAdmin = require("../../middlewares/requireSuperAdmin");
const validate = require("../../middlewares/validate.middleware");
const {
  adminLoginSchema,
  adminRegisterSchema,
} = require("../../validations/admin.validation");

router.post("/admin/login", validate(adminLoginSchema), AdminController.Login);
router.post(
  "/admin/create-moderator",
  authenticateAdmin,
  requireSuperAdmin,
  validate(adminRegisterSchema),
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

