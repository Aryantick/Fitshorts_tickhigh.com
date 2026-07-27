const authRepository = require("./auth.repository");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  verifyRefreshToken,
} = require("../../utils/jwt");

async function refreshAccessToken(refreshToken) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const userId = payload.userId;

    const storedTokens = await authRepository.findRefreshTokensByUserId(userId);

    let matchedToken = null;
    for (const row of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, row.token_hash);
      if (isMatch) {
        matchedToken = row;
        break;
      }
    }

    if (!matchedToken) {
      throw new Error("Refresh token not recognized");
    }

    // NO rotation — same refresh token stays valid until it expires (30 days)
    const newAccessToken = generateAccessToken(userId);

    return { accessToken: newAccessToken };
  } catch (error) {
    console.error("refreshAccessToken error:", error.message);
    throw new Error("Invalid or expired refresh token");
  }
}
async function logout(userId) {
  await authRepository.deleteRefreshTokensByUserId(userId);
  return { message: "Logged out successfully" };
}

module.exports = {
  refreshAccessToken,
  logout
};