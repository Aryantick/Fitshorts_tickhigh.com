// Barrel re-export of modular Admin Repositories
const AdminAuthRepository = require("./auth/adminAuth.repository");
const DashboardRepository = require("./dashboard/dashboard.repository");
const ModerationRepository = require("./moderation/moderation.repository");
const AdminUsersRepository = require("./users/adminUsers.repository");
const CategoriesRepository = require("./categories/categories.repository");
const LeaderboardRepository = require("./leaderboard/leaderboard.repository");
const AuditRepository = require("./audit/audit.repository");
const AdminMusicRepository = require("./music/adminMusic.repository");

module.exports = {
  ...AdminAuthRepository,
  ...DashboardRepository,
  ...ModerationRepository,
  ...AdminUsersRepository,
  ...CategoriesRepository,
  ...LeaderboardRepository,
  ...AuditRepository,
  ...AdminMusicRepository,
};
