const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminAuthRepository = require("./adminAuth.repository");
const AdminRolesRepository = require("../roles/adminRoles.repository");
const AuditRepository = require("../audit/audit.repository");
const JwtConfig = require("../../../config/jwt.config");
const { AUDIT_ACTIONS } = require("../../../constants/enums");
const { buildAdminMenus } = require("./menuBuilder");

// Helper to parse role permissions safely
function parsePermissions(perm) {
  if (!perm) {
    return {
      pages: ["dashboard"],
      actions: { isReadOnly: true },
    };
  }
  return typeof perm === "string" ? JSON.parse(perm) : perm;
}

// ==========================================
// 1. ADMIN LOGIN (EMAIL + PASSWORD)
// ==========================================

async function loginAdmin({ email, identifier, password, ipAddress = null }) {
  const loginIdentifier = (email || identifier || "").trim();
  if (!loginIdentifier || !password) {
    throw new Error("Email and password are required");
  }

  const admin = await AdminAuthRepository.findAdminByEmailOrUsername(loginIdentifier);
  if (!admin) {
    throw new Error("Invalid email or password");
  }

  if (admin.is_active === 0) {
    throw new Error("This admin account is deactivated. Please contact support.");
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const permissions = parsePermissions(admin.role_permissions);

  // Access Token (30m) & Refresh Token (7d)
  const accessToken = jwt.sign(
    {
      adminId: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role_slug || admin.role,
      roleId: admin.role_id,
      clientId: admin.client_id || null,
      permissions,
    },
    JwtConfig.adminAccessSecret,
    { expiresIn: JwtConfig.adminAccessExpiry }
  );

  const refreshToken = jwt.sign(
    {
      adminId: admin.id,
      roleId: admin.role_id,
    },
    JwtConfig.adminRefreshSecret,
    { expiresIn: JwtConfig.adminRefreshExpiry }
  );

  // Log successful login
  try {
    await AuditRepository.createAuditLog({
      adminId: admin.id,
      adminUsername: admin.username,
      action: AUDIT_ACTIONS.ADMIN_LOGIN,
      targetType: "admin",
      targetId: admin.id,
      details: {
        role: admin.role_slug || admin.role,
        email: admin.email,
        clientId: admin.client_id,
      },
      ipAddress,
    });
  } catch (auditErr) {
    console.warn("Audit log error:", auditErr.message);
  }

  const menus = await buildAdminMenus(admin.role_slug || admin.role, permissions);

  const adminObj = {
    menus,
    id: admin.id,
    name: admin.display_name || admin.username,
    username: admin.username,
    email: admin.email,
    displayName: admin.display_name || admin.username,
    role: admin.role_slug || admin.role,
    roleName: admin.role_name || admin.role,
    roleId: admin.role_id,
    clientId: admin.client_id || null,
    clientName: admin.client_name || "Global (All Clients)",
    permissions,
  };

  return {
    accessToken,
    refreshToken,
    admin: adminObj,
  };
}

async function getAdminProfile(adminId) {
  const admin = await AdminAuthRepository.findAdminById(adminId);
  if (!admin) {
    throw new Error("Admin profile not found");
  }

  const permissions = parsePermissions(admin.role_permissions);

  return {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    displayName: admin.display_name || admin.username,
    role: admin.role_slug || admin.role,
    roleName: admin.role_name || admin.role,
    roleId: admin.role_id,
    clientId: admin.client_id || null,
    clientName: admin.client_name || "Global (All Clients)",
    clientSubdomain: admin.client_subdomain || null,
    isActive: admin.is_active,
    createdAt: admin.created_at,
    permissions,
    menus: await buildAdminMenus(admin.role_slug || admin.role, permissions),
  };
}

async function changeAdminPassword(adminId, currentPassword, newPassword) {
  const admin = await AdminAuthRepository.findAdminById(adminId);
  if (!admin) {
    throw new Error("Admin not found");
  }

  const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!isValid) {
    throw new Error("Incorrect current password");
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await AdminAuthRepository.updateAdminPassword(admin.id, newHash);
  return { success: true, message: "Password updated successfully" };
}

// ==========================================
// 2. ADMIN USER TEAM MANAGEMENT (CREATE WITH EMAIL + PASSWORD)
// ==========================================

async function getAdminUsersList(filters) {
  return await AdminAuthRepository.findAllAdminUsers(filters);
}

async function createAdminUser({
  username,
  email,
  password,
  roleId = null,
  roleSlug = null,
  clientId = null,
  displayName = null,
  creatorAdminId,
  creatorUsername,
  creatorClientId = null,
  ipAddress = null,
}) {
  if (!email || !email.includes("@")) {
    throw new Error("A valid email address is required");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  const safeUsername = (username || email.split("@")[0]).trim();

  // Check unique username or email
  const existing = await AdminAuthRepository.findAdminByEmailOrUsername(email);
  if (existing) {
    throw new Error("An admin account with this email already exists");
  }

  // Determine Role & Role ID
  let assignedRoleId = roleId;
  let assignedRoleSlug = roleSlug;

  if (assignedRoleId) {
    const roleObj = await AdminRolesRepository.findRoleById(assignedRoleId);
    if (roleObj) {
      assignedRoleSlug = roleObj.slug;
    }
  } else if (assignedRoleSlug) {
    const roleObj = await AdminRolesRepository.findRoleBySlug(assignedRoleSlug, clientId);
    if (roleObj) {
      assignedRoleId = roleObj.id;
    }
  }

  if (!assignedRoleId) {
    // Default to Moderator (id: 3)
    assignedRoleId = 3;
    assignedRoleSlug = "moderator";
  }

  // Tenant scoping: Client admin cannot create super admins or admins for other clients!
  const finalClientId = creatorClientId ? creatorClientId : (clientId || null);

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await AdminAuthRepository.createAdminUser({
    username: safeUsername,
    email: email.trim().toLowerCase(),
    passwordHash,
    role: assignedRoleSlug,
    roleId: assignedRoleId,
    clientId: finalClientId,
    displayName: displayName || safeUsername,
  });

  try {
    await AuditRepository.createAuditLog({
      adminId: creatorAdminId,
      adminUsername: creatorUsername,
      action: "admin_user_created",
      targetType: "admin",
      targetId: result.insertId,
      details: { email, role: assignedRoleSlug, clientId: finalClientId },
      ipAddress,
    });
  } catch (err) {}

  return {
    id: result.insertId,
    username: safeUsername,
    email: email.trim().toLowerCase(),
    role: assignedRoleSlug,
    roleId: assignedRoleId,
    clientId: finalClientId,
  };
}

async function updateAdminUserRole(adminId, roleId, creatorAdminId, creatorUsername, ipAddress) {
  const roleObj = await AdminRolesRepository.findRoleById(roleId);
  if (!roleObj) {
    throw new Error("Specified role not found");
  }

  await AdminAuthRepository.updateAdminUserRole(adminId, roleObj.id, roleObj.slug);

  try {
    await AuditRepository.createAuditLog({
      adminId: creatorAdminId,
      adminUsername: creatorUsername,
      action: "admin_user_role_updated",
      targetType: "admin",
      targetId: adminId,
      details: { newRole: roleObj.slug, roleName: roleObj.name },
      ipAddress,
    });
  } catch (err) {}

  return { success: true, message: `Admin role updated to ${roleObj.name}` };
}

async function toggleAdminUserActive(adminId, creatorAdminId, creatorUsername, ipAddress) {
  if (Number(adminId) === Number(creatorAdminId)) {
    throw new Error("You cannot deactivate your own admin account");
  }

  await AdminAuthRepository.toggleAdminUserActive(adminId);

  try {
    await AuditRepository.createAuditLog({
      adminId: creatorAdminId,
      adminUsername: creatorUsername,
      action: "admin_user_status_toggled",
      targetType: "admin",
      targetId: adminId,
      ipAddress,
    });
  } catch (err) {}

  return { success: true, message: "Admin user active status toggled" };
}

async function refreshAdminToken(refreshToken) {
  if (!refreshToken) {
    throw new Error("No refresh token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JwtConfig.adminRefreshSecret);
  } catch (err) {
    throw new Error("Invalid or expired refresh token. Please login again.");
  }

  const admin = await AdminAuthRepository.findAdminById(decoded.adminId);
  if (!admin) {
    throw new Error("Admin not found");
  }

  if (admin.is_active === 0) {
    throw new Error("This admin account is deactivated");
  }

  const permissions = parsePermissions(admin.role_permissions);

  const newAccessToken = jwt.sign(
    {
      adminId: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role_slug || admin.role,
      roleId: admin.role_id,
      clientId: admin.client_id || null,
      permissions,
    },
    JwtConfig.adminAccessSecret,
    { expiresIn: JwtConfig.adminAccessExpiry }
  );

  const newRefreshToken = jwt.sign(
    {
      adminId: admin.id,
      roleId: admin.role_id,
    },
    JwtConfig.adminRefreshSecret,
    { expiresIn: JwtConfig.adminRefreshExpiry }
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

async function deleteAdminUser(adminId, creatorAdminId, creatorUsername, ipAddress) {
  if (Number(adminId) === Number(creatorAdminId)) {
    throw new Error("You cannot delete your own admin account");
  }

  const target = await AdminAuthRepository.findAdminById(adminId);
  if (!target) {
    throw new Error("Admin user not found");
  }

  if (target.role === "super_admin" || target.role_slug === "super_admin") {
    throw new Error("Super Admin accounts are permanently protected and cannot be deleted");
  }

  await AdminAuthRepository.deleteAdminUser(adminId);

  try {
    await AuditRepository.createAuditLog({
      adminId: creatorAdminId,
      adminUsername: creatorUsername,
      action: "admin_user_deleted",
      targetType: "admin",
      targetId: adminId,
      ipAddress,
    });
  } catch (err) {}

  return { success: true, message: "Admin user permanently deleted" };
}

module.exports = {
  loginAdmin,
  refreshAdminToken,
  getAdminProfile,
  changeAdminPassword,
  getAdminUsersList,
  createAdminUser,
  updateAdminUserRole,
  toggleAdminUserActive,
  deleteAdminUser,
};
