const pool = require("../../../config/db.config");

async function findAdminByEmailOrUsername(emailOrUsername) {
  const [rows] = await pool.query(
    `SELECT 
      a.*,
      r.name AS role_name,
      r.slug AS role_slug,
      r.permissions AS role_permissions,
      c.name AS client_name,
      c.subdomain AS client_subdomain
    FROM admins a
    LEFT JOIN admin_roles r ON (a.role_id = r.id OR a.role = r.slug)
    LEFT JOIN clients c ON a.client_id = c.id
    WHERE a.email = ? OR a.username = ?
    LIMIT 1`,
    [emailOrUsername, emailOrUsername]
  );
  return rows[0] || null;
}

async function findAdminById(id) {
  const [rows] = await pool.query(
    `SELECT 
      a.id,
      a.username,
      a.email,
      a.password_hash,
      a.role,
      a.role_id,
      a.client_id,
      a.display_name,
      a.is_active,
      a.created_at,
      r.name AS role_name,
      r.slug AS role_slug,
      r.permissions AS role_permissions,
      c.name AS client_name,
      c.subdomain AS client_subdomain
    FROM admins a
    LEFT JOIN admin_roles r ON (a.role_id = r.id OR a.role = r.slug)
    LEFT JOIN clients c ON a.client_id = c.id
    WHERE a.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findAllAdminUsers({ clientScope = null, search = null, page = 1, limit = 10 }) {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Math.min(100, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (clientScope) {
    conditions.push("a.client_id = ?");
    params.push(Number(clientScope));
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    conditions.push("(a.username LIKE ? OR a.email LIKE ? OR a.display_name LIKE ?)");
    params.push(term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM admins a ${whereClause}`,
    params
  );
  const total = countResult[0] ? countResult[0].total : 0;

  const [rows] = await pool.query(
    `SELECT 
      a.id,
      a.username,
      a.email,
      a.role,
      a.role_id,
      a.client_id,
      a.display_name,
      a.is_active,
      a.created_at,
      r.name AS role_name,
      r.slug AS role_slug,
      c.name AS client_name
    FROM admins a
    LEFT JOIN admin_roles r ON (a.role_id = r.id OR a.role = r.slug)
    LEFT JOIN clients c ON a.client_id = c.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  return {
    admin_users: rows,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
}

async function createAdminUser({
  username,
  email,
  passwordHash,
  role = "moderator",
  roleId = null,
  clientId = null,
  displayName = null,
}) {
  const [result] = await pool.query(
    `INSERT INTO admins 
     (username, email, password_hash, role, role_id, client_id, display_name) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [username, email, passwordHash, role, roleId || null, clientId || null, displayName || username]
  );
  return result;
}

async function updateAdminUserRole(adminId, roleId, roleSlug, clientId = undefined) {
  let sql = "UPDATE admins SET role = ?, role_id = ?";
  const params = [roleSlug, roleId];

  if (clientId !== undefined) {
    sql += ", client_id = ?";
    params.push(clientId || null);
  }

  sql += " WHERE id = ?";
  params.push(adminId);

  const [result] = await pool.query(sql, params);
  return result;
}

async function toggleAdminUserActive(adminId) {
  const [result] = await pool.query(
    "UPDATE admins SET is_active = NOT is_active WHERE id = ?",
    [adminId]
  );
  return result;
}

async function updateAdminPassword(adminId, passwordHash) {
  const [result] = await pool.query(
    "UPDATE admins SET password_hash = ? WHERE id = ?",
    [passwordHash, adminId]
  );
  return result;
}
async function deleteAdminUser(adminId) {
  const [result] = await pool.query(
    "DELETE FROM admins WHERE id = ?",
    [adminId]
  );
  return result;
}

module.exports = {
  findAdminByEmailOrUsername,
  findAdminById,
  findAllAdminUsers,
  createAdminUser,
  updateAdminUserRole,
  toggleAdminUserActive,
  updateAdminPassword,
  deleteAdminUser,
};
