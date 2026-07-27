const apiResponse = require("../utils/apiResponse");

function requireSuperAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== "super_admin") {
    return apiResponse(res, 403, "Access denied. Super admin only.");
  }

  next();
}

module.exports = requireSuperAdmin;