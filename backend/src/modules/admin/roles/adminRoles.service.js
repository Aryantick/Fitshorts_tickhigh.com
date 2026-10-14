const AdminRolesRepository = require("./adminRoles.repository");
const AuditRepository = require("../audit/audit.repository");

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "_");
}

async function getRolesList(clientScope = null) {
  return await AdminRolesRepository.findAllRoles(clientScope);
}

async function getRoleById(id) {
  const role = await AdminRolesRepository.findRoleById(id);
  if (!role) {
    throw new Error("Role not found");
  }
  return role;
}

async function createNewRole({ name, description, permissions, clientId = null, adminId, adminUsername, ipAddress }) {
  if (!name || name.trim().length === 0) {
    throw new Error("Role name is required");
  }

  const slug = slugify(name);
  const existing = await AdminRolesRepository.findRoleBySlug(slug, clientId);
  if (existing) {
    throw new Error(`A role with slug '${slug}' already exists for this client scope.`);
  }

  const defaultPermissions = permissions || {
    pages: ["dashboard", "moderation"],
    actions: { isReadOnly: false, canApproveReel: true, canRejectReel: true },
  };

  const result = await AdminRolesRepository.createRole({
    clientId,
    name: name.trim(),
    slug,
    description,
    permissions: defaultPermissions,
  });

  try {
    await AuditRepository.createAuditLog({
      adminId,
      adminUsername,
      action: "role_created",
      targetType: "role",
      targetId: result.insertId,
      details: { name, slug, clientId },
      ipAddress,
    });
  } catch (err) {}

  return {
    id: result.insertId,
    name,
    slug,
    clientId,
    permissions: defaultPermissions,
  };
}

async function updateExistingRole(id, { name, description, permissions }, adminId, adminUsername, ipAddress) {
  const role = await AdminRolesRepository.findRoleById(id);
  if (!role) {
    throw new Error("Role not found");
  }

  // System roles cannot be renamed, but their permissions can be updated if super admin desires
  const updates = {
    name: role.is_system_role ? role.name : (name || role.name),
    description: description !== undefined ? description : role.description,
    permissions: permissions !== undefined ? permissions : role.permissions,
  };

  await AdminRolesRepository.updateRole(id, updates);

  try {
    await AuditRepository.createAuditLog({
      adminId,
      adminUsername,
      action: "role_updated",
      targetType: "role",
      targetId: id,
      details: { roleName: role.name },
      ipAddress,
    });
  } catch (err) {}

  return { success: true, message: `Role '${role.name}' updated successfully` };
}

async function deleteExistingRole(id, adminId, adminUsername, ipAddress) {
  const role = await AdminRolesRepository.findRoleById(id);
  if (!role) {
    throw new Error("Role not found");
  }
  if (role.is_system_role) {
    throw new Error("System default roles cannot be deleted");
  }

  const result = await AdminRolesRepository.deleteRole(id);
  if (result.affectedRows === 0) {
    throw new Error("Role could not be deleted");
  }

  try {
    await AuditRepository.createAuditLog({
      adminId,
      adminUsername,
      action: "role_deleted",
      targetType: "role",
      targetId: id,
      details: { roleName: role.name },
      ipAddress,
    });
  } catch (err) {}

  return { success: true, message: `Role '${role.name}' deleted successfully` };
}

module.exports = {
  getRolesList,
  getRoleById,
  createNewRole,
  updateExistingRole,
  deleteExistingRole,
};
