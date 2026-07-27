const jwt = require("jsonwebtoken");
const JwtConfig = require("../config/jwt.config");

function generateAccessToken(userId) {
  return jwt.sign(
    { userId },
    JwtConfig.accessSecret,
    {
      expiresIn: JwtConfig.accessExpiry,
    }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    JwtConfig.refreshSecret,
    {
      expiresIn: JwtConfig.refreshExpiry,
    }
  );
}

function verifyRefreshToken(token) {
  return jwt.verify(token, JwtConfig.refreshSecret);
}
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
};