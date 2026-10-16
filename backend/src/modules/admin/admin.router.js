const router = require("express").Router();
const authenticateAdmin = require("../../middlewares/authenticateAdmin");
const requireSuperAdmin = require("../../middlewares/requireSuperAdmin");
const enforceTenantScope = require("../../middlewares/enforceTenantScope");
const { requireAction } = require("../../middlewares/checkPermission");
const validate = require("../../middlewares/validate.middleware");
const {
  adminLoginSchema,
  adminRegisterSchema,
} = require("../../validations/admin.validation");

// Sub-domain Modular Controllers
const AdminAuthController = require("./auth/adminAuth.controller");
const AdminRolesController = require("./roles/adminRoles.controller");
const DashboardController = require("./dashboard/dashboard.controller");
const ModerationController = require("./moderation/moderation.controller");
const AdminUsersController = require("./users/adminUsers.controller");
const CategoriesController = require("./categories/categories.controller");
const LeaderboardController = require("./leaderboard/leaderboard.controller");
const AuditController = require("./audit/audit.controller");
const AdminMusicController = require("./music/adminMusic.controller");
const AdminMenusController = require("./menus/adminMenus.controller");

// ==========================================
// 1. ADMIN AUTH & SESSION (EMAIL + PASSWORD LOGIN)
// ==========================================
router.post("/admin/login", validate(adminLoginSchema), AdminAuthController.Login);
router.post("/admin/refresh-token", AdminAuthController.refreshToken);
router.post("/admin/logout", AdminAuthController.logout);
router.get("/admin/me", authenticateAdmin, AdminAuthController.getMe);
router.post("/admin/change-password", authenticateAdmin, AdminAuthController.changePassword);

// ==========================================
// 2. DYNAMIC ROLES & PERMISSIONS CRUD (UI DRIVEN)
// ==========================================
router.get("/admin/roles", authenticateAdmin, enforceTenantScope, AdminRolesController.getRoles);
router.get("/admin/roles/:id", authenticateAdmin, enforceTenantScope, AdminRolesController.getRoleById);
router.post("/admin/roles", authenticateAdmin, enforceTenantScope, requireAction("canManageRoles"), AdminRolesController.createRole);
router.put("/admin/roles/:id", authenticateAdmin, enforceTenantScope, requireAction("canManageRoles"), AdminRolesController.updateRole);
router.delete("/admin/roles/:id", authenticateAdmin, enforceTenantScope, requireAction("canManageRoles"), AdminRolesController.deleteRole);

// ==========================================
// 3. ADMIN TEAM MANAGEMENT (CREATE USER WITH EMAIL & PASSWORD)
// ==========================================
router.get("/admin/admin-users", authenticateAdmin, enforceTenantScope, AdminAuthController.getAdminUsers);
router.post("/admin/admin-users", authenticateAdmin, enforceTenantScope, requireAction("canManageAdmins"), AdminAuthController.createAdminUser);
router.patch("/admin/admin-users/:id/role", authenticateAdmin, enforceTenantScope, requireAction("canManageAdmins"), AdminAuthController.updateAdminRole);
router.patch("/admin/admin-users/:id/toggle", authenticateAdmin, enforceTenantScope, requireAction("canManageAdmins"), AdminAuthController.toggleAdminActive);
router.delete("/admin/admin-users/:id", authenticateAdmin, enforceTenantScope, requireAction("canManageAdmins"), AdminAuthController.deleteAdminUser);

// Backwards-compatible moderator creation route
router.post(
  "/admin/create-moderator",
  authenticateAdmin,
  requireSuperAdmin,
  validate(adminRegisterSchema),
  AdminAuthController.createAdminUser
);

// ==========================================
// 4. DASHBOARD & MULTI-TENANT CLIENTS
// ==========================================
router.get("/admin/dashboard/stats", authenticateAdmin, enforceTenantScope, DashboardController.getDashboardStats);
router.get("/admin/clients", authenticateAdmin, enforceTenantScope, DashboardController.getClients);

// ==========================================
// 5. REELS MODERATION & FIFO QUEUE
// ==========================================
router.get("/admin/reels/rejection-reasons", authenticateAdmin, ModerationController.getRejectionReasons);
router.get("/admin/reels", authenticateAdmin, enforceTenantScope, ModerationController.getReels);
router.get("/admin/reel/pending", authenticateAdmin, enforceTenantScope, (req, res, next) => {
  req.query.status = "pending_review";
  return ModerationController.getReels(req, res, next);
});
router.get("/admin/reels/:id", authenticateAdmin, enforceTenantScope, ModerationController.getReelById);
router.patch("/admin/reels/:id/approve", authenticateAdmin, enforceTenantScope, requireAction("canApproveReel"), ModerationController.approveReel);
router.patch("/admin/reels/:id/reject", authenticateAdmin, enforceTenantScope, requireAction("canRejectReel"), ModerationController.rejectReel);
router.patch("/admin/reels/:id/suspend", authenticateAdmin, enforceTenantScope, requireAction("canSuspendReel"), ModerationController.suspendReel);
router.delete("/admin/reels/:id/delete", authenticateAdmin, enforceTenantScope, requireSuperAdmin, ModerationController.deleteReel);

// ==========================================
// 6. USER MANAGEMENT (WITH CLIENT CONTEXT)
// ==========================================
router.get("/admin/users", authenticateAdmin, enforceTenantScope, AdminUsersController.getUsers);
router.get("/admin/users/:id", authenticateAdmin, enforceTenantScope, AdminUsersController.getUserById);
router.get("/admin/users/:id/reels", authenticateAdmin, enforceTenantScope, AdminUsersController.getUserReels);
router.patch("/admin/users/:id/status", authenticateAdmin, enforceTenantScope, requireAction("canBlockUser"), AdminUsersController.toggleUserBlock);

// ==========================================
// 7. CATEGORIES MANAGEMENT CRUD
// ==========================================
router.get("/admin/categories", authenticateAdmin, CategoriesController.getCategories);
router.post("/admin/categories", authenticateAdmin, requireAction("canManageCategories"), CategoriesController.createCategory);
router.put("/admin/categories/:id", authenticateAdmin, requireAction("canManageCategories"), CategoriesController.updateCategory);
router.patch("/admin/categories/:id/toggle", authenticateAdmin, requireAction("canManageCategories"), CategoriesController.toggleCategory);

// ==========================================
// 8. LEADERBOARD (PERIOD & CLIENT FILTER)
// ==========================================
router.get("/admin/leaderboard", authenticateAdmin, enforceTenantScope, LeaderboardController.getLeaderboard);

// ==========================================
// 9. AUDIT LOGS
// ==========================================
router.get("/admin/audit-logs", authenticateAdmin, enforceTenantScope, AuditController.getAuditLogs);

// ==========================================
// 10. SUPER ADMIN BULK MUSIC UPLOAD
// ==========================================
router.post(
  "/admin/music/bulk-upload",
  authenticateAdmin,
  requireAction("canBulkUploadMusic"),
  AdminMusicController.bulkUploadMusic
);


// ==========================================
// DYNAMIC NAVIGATION MENUS CRUD (DATABASE DRIVEN - SUPER ADMIN ONLY)
// ==========================================
router.get("/admin/menus", authenticateAdmin, AdminMenusController.getMenus);
router.post("/admin/menus", authenticateAdmin, requireSuperAdmin, AdminMenusController.createMenu);
router.put("/admin/menus/:id", authenticateAdmin, requireSuperAdmin, AdminMenusController.updateMenu);
router.delete("/admin/menus/:id", authenticateAdmin, requireSuperAdmin, AdminMenusController.deleteMenu);

module.exports = router;
