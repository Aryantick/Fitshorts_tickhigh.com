const AdminAuthService = require("./adminAuth.service");
const apiResponse = require("../../../utils/apiResponse");

// ==========================================
// 1. ADMIN LOGIN (EMAIL + PASSWORD)
// ==========================================

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

async function Login(req, res) {
  try {
    const { email, identifier, password } = req.body;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await AdminAuthService.loginAdmin({
      email: email || identifier,
      password,
      ipAddress,
    });

    // Set 7-day refresh token in HTTP-only cookie
    if (result.refreshToken) {
      res.cookie("adminRefreshToken", result.refreshToken, COOKIE_OPTIONS);
      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
      delete result.refreshToken;
    }

    return apiResponse(res, 200, "Login successful", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function refreshToken(req, res) {
  try {
    const token =
      req.cookies?.adminRefreshToken ||
      req.cookies?.refreshToken ||
      req.body?.refreshToken;

    if (!token) {
      return apiResponse(res, 401, "No refresh token found", null);
    }

    const result = await AdminAuthService.refreshAdminToken(token);

    if (result.refreshToken) {
      res.cookie("adminRefreshToken", result.refreshToken, COOKIE_OPTIONS);
      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    }

    return apiResponse(res, 200, "Token refreshed successfully", {
      accessToken: result.accessToken,
    });
  } catch (error) {
    return apiResponse(res, 401, error.message, null);
  }
}

async function logout(req, res) {
  res.clearCookie("adminRefreshToken");
  res.clearCookie("refreshToken");
  return apiResponse(res, 200, "Logged out successfully", null);
}

async function getMe(req, res) {
  try {
    const adminId = req.admin?.adminId;
    const admin = await AdminAuthService.getAdminProfile(adminId);
    return apiResponse(res, 200, "Admin profile fetched successfully", admin);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function changePassword(req, res) {
  try {
    const adminId = req.admin?.adminId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return apiResponse(res, 400, "currentPassword and newPassword are required", null);
    }

    const result = await AdminAuthService.changeAdminPassword(adminId, currentPassword, newPassword);
    return apiResponse(res, 200, "Password changed successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

// ==========================================
// 2. ADMIN TEAM MANAGEMENT (CREATE USER WITH EMAIL & PASSWORD)
// ==========================================

async function getAdminUsers(req, res) {
  try {
    const { client_id, search, page, limit } = req.query;
    // Client admins can only see their own admin team
    const clientScope = req.admin.clientId ? req.admin.clientId : (client_id || null);

    const result = await AdminAuthService.getAdminUsersList({
      clientScope,
      search,
      page: page || 1,
      limit: limit || 10,
    });
    return apiResponse(res, 200, "Admin users fetched successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function createAdminUser(req, res) {
  try {
    const { username, email, password, role_id, role, client_id, display_name } = req.body;

    if (!email || !password) {
      return apiResponse(res, 400, "Email and password are required", null);
    }

    const creatorAdminId = req.admin.adminId;
    const creatorUsername = req.admin.username;
    const creatorClientId = req.admin.clientId || null;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await AdminAuthService.createAdminUser({
      username,
      email,
      password,
      roleId: role_id,
      roleSlug: role,
      clientId: client_id,
      displayName: display_name,
      creatorAdminId,
      creatorUsername,
      creatorClientId,
      ipAddress,
    });
    return apiResponse(res, 201, "Admin user created successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function updateAdminRole(req, res) {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    if (!role_id) {
      return apiResponse(res, 400, "role_id is required", null);
    }

    const creatorAdminId = req.admin.adminId;
    const creatorUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await AdminAuthService.updateAdminUserRole(
      id,
      role_id,
      creatorAdminId,
      creatorUsername,
      ipAddress
    );
    return apiResponse(res, 200, result.message, result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function toggleAdminActive(req, res) {
  try {
    const { id } = req.params;
    const creatorAdminId = req.admin.adminId;
    const creatorUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await AdminAuthService.toggleAdminUserActive(
      id,
      creatorAdminId,
      creatorUsername,
      ipAddress
    );
    return apiResponse(res, 200, result.message, result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function deleteAdminUser(req, res) {
  try {
    const { id } = req.params;
    const creatorAdminId = req.admin.adminId;
    const creatorUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await AdminAuthService.deleteAdminUser(
      id,
      creatorAdminId,
      creatorUsername,
      ipAddress
    );
    return apiResponse(res, 200, result.message, result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

module.exports = {
  Login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  getAdminUsers,
  createAdminUser,
  updateAdminRole,
  toggleAdminActive,
  deleteAdminUser,
};
