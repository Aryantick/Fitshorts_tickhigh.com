require("dotenv").config();

module.exports = {
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  adminAccessSecret: process.env.JWT_ADMIN_ACCESS_SECRET,
  accessExpiry: "15m",
  refreshExpiry: "30d",
};
