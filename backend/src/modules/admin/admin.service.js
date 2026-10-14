// Barrel re-export of modular Admin Services
const AdminAuthService = require("./auth/adminAuth.service");
const DashboardService = require("./dashboard/dashboard.service");
const ModerationService = require("./moderation/moderation.service");
const AdminUsersService = require("./users/adminUsers.service");
const CategoriesService = require("./categories/categories.service");
const LeaderboardService = require("./leaderboard/leaderboard.service");
const AuditService = require("./audit/audit.service");
const AdminMusicService = require("./music/adminMusic.service");

module.exports = {
  ...AdminAuthService,
  ...DashboardService,
  ...ModerationService,
  ...AdminUsersService,
  ...CategoriesService,
  ...LeaderboardService,
  ...AuditService,
  ...AdminMusicService,
};
