const fs = require("fs");
const path = require("path");
const { generateCurl } = require("./curlGenerator");

const LOGS_BASE_DIR = path.resolve(__dirname, "../../logs/telecom");

/**
 * Ensure directory exists synchronously/safely
 */
function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Format Date to YYYY-MM-DD string for file names
 */
function getDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Format Date to YYYY-MM-DD HH:mm:ss string for log entries
 */
function getDateTimeString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

/**
 * Append log entry to client-specific log file and global daily log file
 */
async function writeLogEntry(subdomain, logBlock) {
  try {
    const today = getDateString();
    const safeSubdomain = (subdomain || "unknown").toLowerCase().replace(/[^a-z0-9_-]/g, "");

    // 1. Client-specific directory: logs/telecom/<subdomain>/<YYYY-MM-DD>.log
    const clientDir = path.join(LOGS_BASE_DIR, safeSubdomain);
    ensureDirExists(clientDir);
    const clientFilePath = path.join(clientDir, `${today}.log`);

    // 2. Global combined directory: logs/telecom/all/<YYYY-MM-DD>.log
    const allDir = path.join(LOGS_BASE_DIR, "all");
    ensureDirExists(allDir);
    const allFilePath = path.join(allDir, `${today}.log`);

    await Promise.all([
      fs.promises.appendFile(clientFilePath, logBlock + "\n", "utf8"),
      fs.promises.appendFile(allFilePath, logBlock + "\n", "utf8"),
    ]);
  } catch (err) {
    console.error("[TelecomLogger] Failed to write log file:", err.message);
  }
}

/**
 * Format and write success response log
 */
function logSuccess({ config, response, duration }) {
  const meta = config?.metadata || {};
  const subdomain = meta.clientSubdomain || meta.subdomain || "default";
  const clientId = meta.clientId || "N/A";
  const provider = meta.provider || "TELECOM";
  const action = meta.action || "apiCall";
  const msisdn = meta.msisdn || config?.params?.msisdn || config?.data?.msisdn || config?.data?.encryptedMsisdn || "N/A";
  const timestamp = getDateTimeString();
  const curl = meta.curl || generateCurl(config);
  const status = response ? `${response.status} ${response.statusText || "OK"}` : "200 OK";

  let responseBody = "";
  try {
    responseBody = typeof response?.data === "object" 
      ? JSON.stringify(response.data, null, 2) 
      : String(response?.data || "");
  } catch (e) {
    responseBody = String(response?.data || "");
  }

  const logBlock = [
    "=".repeat(80),
    `[${timestamp}] [${provider.toUpperCase()}] Client: ${subdomain} (ID: ${clientId}) | Action: ${action} | MSISDN: ${msisdn}`,
    "-".repeat(80),
    "REQUEST (cURL):",
    curl,
    "",
    `RESPONSE [${status}] (${duration}ms):`,
    responseBody,
    "=".repeat(80),
  ].join("\n");

  writeLogEntry(subdomain, logBlock);

  // Console output in non-production
  if (process.env.NODE_ENV !== "production") {
    console.log(`\x1b[36m[TelecomLog ${provider}] \x1b[32m${action} -> [${status}] (${duration}ms)\x1b[0m`);
  }
}

/**
 * Format and write error response log
 */
function logError({ config, error, duration }) {
  const meta = config?.metadata || {};
  const subdomain = meta.clientSubdomain || meta.subdomain || "default";
  const clientId = meta.clientId || "N/A";
  const provider = meta.provider || "TELECOM";
  const action = meta.action || "apiCall";
  const msisdn = meta.msisdn || config?.params?.msisdn || config?.data?.msisdn || config?.data?.encryptedMsisdn || "N/A";
  const timestamp = getDateTimeString();
  const curl = meta.curl || generateCurl(config);

  const status = error.response 
    ? `${error.response.status} ${error.response.statusText || "ERROR"}`
    : (error.code || "REQUEST_FAILED");

  let errorBody = "";
  try {
    if (error.response?.data) {
      errorBody = typeof error.response.data === "object"
        ? JSON.stringify(error.response.data, null, 2)
        : String(error.response.data);
    } else {
      errorBody = error.message || "Unknown error";
    }
  } catch (e) {
    errorBody = error.message || "Unknown error";
  }

  const logBlock = [
    "=".repeat(80),
    `[${timestamp}] [${provider.toUpperCase()}] [ERROR] Client: ${subdomain} (ID: ${clientId}) | Action: ${action} | MSISDN: ${msisdn}`,
    "-".repeat(80),
    "REQUEST (cURL):",
    curl,
    "",
    `ERROR [${status}] (${duration}ms):`,
    `Message: ${error.message}`,
    "Response Body:",
    errorBody,
    "=".repeat(80),
  ].join("\n");

  writeLogEntry(subdomain, logBlock);

  if (process.env.NODE_ENV !== "production") {
    console.error(`\x1b[31m[TelecomLog ${provider} ERROR] ${action} -> [${status}] (${duration}ms): ${error.message}\x1b[0m`);
  }
}

/**
 * Attach logging interceptors to an Axios instance
 */
function attachTelecomLogger(axiosClient, defaultMetadata = {}) {
  if (!axiosClient || !axiosClient.interceptors) {
    return axiosClient;
  }

  // Request Interceptor: capture start time and pre-generate cURL
  axiosClient.interceptors.request.use(
    (config) => {
      config.metadata = {
        startTime: Date.now(),
        ...defaultMetadata,
        ...(config.metadata || {}),
      };
      config.metadata.curl = generateCurl(config);
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor: log response and duration
  axiosClient.interceptors.response.use(
    (response) => {
      const startTime = response.config?.metadata?.startTime || Date.now();
      const duration = Date.now() - startTime;
      logSuccess({ config: response.config, response, duration });
      return response;
    },
    (error) => {
      const config = error.config || {};
      const startTime = config?.metadata?.startTime || Date.now();
      const duration = Date.now() - startTime;
      logError({ config, error, duration });
      return Promise.reject(error);
    }
  );

  return axiosClient;
}

module.exports = {
  LOGS_BASE_DIR,
  attachTelecomLogger,
  logSuccess,
  logError,
  getDateString,
  getDateTimeString,
};
