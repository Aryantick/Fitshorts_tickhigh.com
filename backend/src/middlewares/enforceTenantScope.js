/**
 * Multi-Tenant Scoping Middleware
 * Automatically locks Client Admins to their designated client_id.
 * Super Admins (clientId === null) can view any client or pass ?client_id=X.
 */
function enforceTenantScope(req, res, next) {
  if (req.admin && req.admin.clientId) {
    // Lock client scope in query and body
    req.query.client_id = req.admin.clientId;
    if (req.body && typeof req.body === "object") {
      req.body.client_id = req.admin.clientId;
    }
  }
  next();
}

module.exports = enforceTenantScope;
