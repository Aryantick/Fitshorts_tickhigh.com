const apiResponse = require("../utils/apiResponse");

/**
 * RBAC Action Permission Checker
 * Verifies if the authenticated admin has the required action permission.
 */
function requireAction(actionName) {
  return (req, res, next) => {
    const admin = req.admin;
    if (!admin) {
      return apiResponse(res, 401, "Authentication required");
    }

    // Super Admin bypasses all checks
    if (admin.role === "super_admin") {
      return next();
    }

    const perms = admin.permissions || {};
    const actions = perms.actions || {};

    if (actions.all === true) {
      return next();
    }

    if (actions[actionName] === true) {
      return next();
    }

    return apiResponse(
      res,
      403,
      `Permission denied: Your role profile does not have permission to '${actionName}'.`
    );
  };
}

module.exports = {
  requireAction,
};
