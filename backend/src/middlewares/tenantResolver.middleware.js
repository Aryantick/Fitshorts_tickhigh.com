const clientService = require("../modules/client/client.service");

/**
 * Extracts subdomain string from incoming request
 * Checks x-client-subdomain header first, then falls back to hostname
 */
function extractSubdomain(req) {
  // 1. Priority: x-client-subdomain header (for local dev and frontend API requests)
  const headerSubdomain = req.headers["x-client-subdomain"];
  if (headerSubdomain && typeof headerSubdomain === "string") {
    return headerSubdomain.trim().toLowerCase();
  }

  // 2. Subdomain from host header / domain name (e.g. obf.wellnesss360.com -> obf)
  const host = req.hostname || (req.headers.host ? req.headers.host.split(":")[0] : "");
  if (!host) return null;

  const parts = host.split(".");

  let subdomain = null;
  if (parts.length === 2 && (parts[1] === "localhost" || parts[1] === "local")) {
    subdomain = parts[0];
  } else if (parts.length > 2) {
    subdomain = parts[0];
  }

  if (!subdomain) return null;

  // Reserved subdomains that shouldn't match a client
  const reserved = ["admin", "www", "api"];
  if (reserved.includes(subdomain.toLowerCase())) return null;

  return subdomain.toLowerCase();
}

/**
 * Express Middleware: Resolves Tenant (req.client) automatically for every request
 */
async function tenantResolver(req, res, next) {
  try {
    const subdomain = extractSubdomain(req);

    if (!subdomain) {
      req.client = null;
      return next();
    }

    // Resolve client details from database by subdomain
    const client = await clientService.resolveClientBySubdomain(subdomain);
    if (!client) {
      return res.status(404).json({ error: "Client not found or inactive" });
    }

    // Attach resolved client object to request
    req.client = client;
    next();
  } catch (error) {
    console.error("tenantResolver error:", error.message);
    return res.status(500).json({ error: "Internal server error resolving client" });
  }
}

module.exports = tenantResolver;
