require("dotenv").config();

module.exports = {
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  adminAccessSecret: process.env.JWT_ADMIN_ACCESS_SECRET,
  adminRefreshSecret: process.env.JWT_ADMIN_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || "admin_refresh_secret_998877665544332211",
  accessExpiry: "15m",
  refreshExpiry: "30d",
  adminAccessExpiry: "30m",
  adminRefreshExpiry: "7d",
};
