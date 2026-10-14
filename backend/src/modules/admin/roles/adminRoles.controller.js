const AdminRolesService = require("./adminRoles.service");
const apiResponse = require("../../../utils/apiResponse");

async function getRoles(req, res) {
  try {
    // If the logged in admin has a clientId, scope the roles to their tenant + global
    const clientScope = req.admin.clientId || null;
    const roles = await AdminRolesService.getRolesList(clientScope);
    return apiResponse(res, 200, "Roles fetched successfully", roles);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function getRoleById(req, res) {
  try {
    const { id } = req.params;
    const role = await AdminRolesService.getRoleById(id);
    return apiResponse(res, 200, "Role fetched successfully", role);
  } catch (error) {
    return apiResponse(res, 404, error.message, null);
  }
}

async function createRole(req, res) {
  try {
    const { name, description, permissions, client_id } = req.body;
    // Client admins can only create roles for their own client
    const targetClientId = req.admin.clientId ? req.admin.clientId : (client_id || null);

    const adminId = req.admin.adminId;
    const adminUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await AdminRolesService.createNewRole({
      name,
      description,
      permissions,
      clientId: targetClientId,
      adminId,
      adminUsername,
      ipAddress,
    });
    return apiResponse(res, 201, "Role created successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    const adminId = req.admin.adminId;
    const adminUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await AdminRolesService.updateExistingRole(
      id,
      { name, description, permissions },
      adminId,
      adminUsername,
      ipAddress
    );
    return apiResponse(res, 200, result.message, result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function deleteRole(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.admin.adminId;
    const adminUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await AdminRolesService.deleteExistingRole(id, adminId, adminUsername, ipAddress);
    return apiResponse(res, 200, result.message, result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
