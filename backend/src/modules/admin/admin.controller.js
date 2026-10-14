// Barrel re-export of modular Admin Controllers
const AdminAuthController = require("./auth/adminAuth.controller");
const DashboardController = require("./dashboard/dashboard.controller");
const ModerationController = require("./moderation/moderation.controller");
const AdminUsersController = require("./users/adminUsers.controller");
const CategoriesController = require("./categories/categories.controller");
const LeaderboardController = require("./leaderboard/leaderboard.controller");
const AuditController = require("./audit/audit.controller");
const AdminMusicController = require("./music/adminMusic.controller");

module.exports = {
  ...AdminAuthController,
  ...DashboardController,
  ...ModerationController,
  ...AdminUsersController,
  ...CategoriesController,
  ...LeaderboardController,
  ...AuditController,
  ...AdminMusicController,
};
