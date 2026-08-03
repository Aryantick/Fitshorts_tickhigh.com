const jwt = require("jsonwebtoken");
const JwtConfig = require("../config/jwt.config");

function generateAccessToken(userId, clientId) {
  return jwt.sign(
    { userId, clientId },
    JwtConfig.accessSecret,
    {
      expiresIn: JwtConfig.accessExpiry,
    }
  );
}

function generateRefreshToken(userId, clientId) {
  return jwt.sign(
    { userId, clientId },
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
  verifyRefreshToken,
};