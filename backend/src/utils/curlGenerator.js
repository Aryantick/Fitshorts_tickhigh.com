/**
 * Utility to convert Axios request configurations into copy-pasteable cURL commands.
 */

function generateCurl(config) {
  if (!config) return "";

  try {
    const method = (config.method || "GET").toUpperCase();
    
    // 1. Determine Full URL
    let fullUrl = config.url || "";
    if (config.baseURL && !fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
      const base = config.baseURL.endsWith("/") ? config.baseURL.slice(0, -1) : config.baseURL;
      const path = fullUrl.startsWith("/") ? fullUrl : `/${fullUrl}`;
      fullUrl = `${base}${path}`;
    }

    // 2. Append query parameters
    if (config.params && typeof config.params === "object") {
      const urlObj = new URL(fullUrl);
      for (const [key, value] of Object.entries(config.params)) {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.append(key, String(value));
        }
      }
      fullUrl = urlObj.toString();
    }

    const parts = [`curl -X ${method} "${fullUrl}"`];

    // 3. Headers
    const rawHeaders = config.headers || {};
    const headers = rawHeaders.toJSON ? rawHeaders.toJSON() : rawHeaders;
    const ignoredHeaders = ["common", "delete", "get", "head", "post", "put", "patch"];

    for (const [key, val] of Object.entries(headers)) {
      if (ignoredHeaders.includes(key.toLowerCase()) || typeof val === "object" || val === undefined) {
        continue;
      }
      const safeVal = String(val).replace(/"/g, '\\"');
      parts.push(`  -H "${key}: ${safeVal}"`);
    }

    // 4. Request Body
    if (config.data && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      let dataStr = "";
      if (typeof config.data === "object") {
        dataStr = JSON.stringify(config.data);
      } else {
        dataStr = String(config.data);
      }
      if (dataStr && dataStr !== "{}" && dataStr !== "null") {
        const escapedData = dataStr.replace(/'/g, "'\\''");
        parts.push(`  --data '${escapedData}'`);
      }
    }

    return parts.join(" \\\n");
  } catch (err) {
    return `# Failed to generate cURL: ${err.message}`;
  }
}

module.exports = {
  generateCurl,
};
