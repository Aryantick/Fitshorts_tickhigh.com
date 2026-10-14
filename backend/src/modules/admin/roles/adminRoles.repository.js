const pool = require("../../../config/db.config");

async function findAllRoles(clientScope = null) {
  let sql = `
    SELECT 
      r.id,
      r.client_id,
      r.name,
      r.slug,
      r.description,
      r.permissions,
      r.is_system_role,
      r.created_at,
      r.updated_at,
      c.name AS client_name
    FROM admin_roles r
    LEFT JOIN clients c ON r.client_id = c.id
  `;
  const params = [];

  if (clientScope) {
    sql += ` WHERE (r.client_id IS NULL OR r.client_id = ?)`;
    params.push(Number(clientScope));
  }

  sql += ` ORDER BY r.is_system_role DESC, r.id ASC`;

  const [rows] = await pool.query(sql, params);
  return rows.map((row) => ({
    ...row,
    permissions: typeof row.permissions === "string" ? JSON.parse(row.permissions) : row.permissions,
  }));
}

async function findRoleById(id) {
  const [rows] = await pool.query(
    "SELECT * FROM admin_roles WHERE id = ?",
    [id]
  );
  if (!rows[0]) return null;
  const role = rows[0];
  return {
    ...role,
    permissions: typeof role.permissions === "string" ? JSON.parse(role.permissions) : role.permissions,
  };
}

async function findRoleBySlug(slug, clientId = null) {
  const sql = clientId
    ? "SELECT * FROM admin_roles WHERE slug = ? AND (client_id = ? OR client_id IS NULL) LIMIT 1"
    : "SELECT * FROM admin_roles WHERE slug = ? LIMIT 1";
  const params = clientId ? [slug, clientId] : [slug];

  const [rows] = await pool.query(sql, params);
  if (!rows[0]) return null;
  const role = rows[0];
  return {
    ...role,
    permissions: typeof role.permissions === "string" ? JSON.parse(role.permissions) : role.permissions,
  };
}

async function createRole({ clientId = null, name, slug, description = null, permissions }) {
  const permJson = typeof permissions === "object" ? JSON.stringify(permissions) : permissions;
  const [result] = await pool.query(
    `INSERT INTO admin_roles (client_id, name, slug, description, permissions, is_system_role)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [clientId || null, name, slug, description, permJson]
  );
  return result;
}

async function updateRole(id, { name, description, permissions }) {
  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push("name = ?");
    params.push(name);
  }
  if (description !== undefined) {
    updates.push("description = ?");
    params.push(description);
  }
  if (permissions !== undefined) {
    updates.push("permissions = ?");
    params.push(typeof permissions === "object" ? JSON.stringify(permissions) : permissions);
  }

  if (updates.length === 0) return { affectedRows: 0 };

  params.push(id);
  const [result] = await pool.query(
    `UPDATE admin_roles SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return result;
}

async function deleteRole(id) {
  const [result] = await pool.query(
    "DELETE FROM admin_roles WHERE id = ? AND is_system_role = 0",
    [id]
  );
  return result;
}

module.exports = {
  findAllRoles,
  findRoleById,
  findRoleBySlug,
  createRole,
  updateRole,
  deleteRole,
};
