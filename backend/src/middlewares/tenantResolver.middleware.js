const clientService = require("../modules/client/client.service");

function extractSubdomain(req) {
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

  const reserved = ["admin", "www", "api"];
  if (reserved.includes(subdomain.toLowerCase())) return null;

  return subdomain.toLowerCase();
}

async function tenantResolver(req, res, next) {
  try {
    const subdomain = extractSubdomain(req);

    if (!subdomain) {
      req.client = null;
      return next();
    }

    const client = await clientService.resolveClientBySubdomain(subdomain);
    if (!client) {
      return res.status(404).json({ error: "Client not found or inactive" });
    }

    req.client = client;
    next();
  } catch (error) {
    console.error("tenantResolver error:", error.message);
    return res.status(500).json({ error: "Internal server error resolving client" });
  }
}

module.exports = tenantResolver;
