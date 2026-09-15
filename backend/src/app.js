/**
 * Main Express Application Initialization
 * Configures CORS, middleware, multi-tenant resolver, and route handlers.
 */
const express = require("express");
const cookieParser = require("cookie-parser");
const tenantResolver = require("./middlewares/tenantResolver.middleware");

const app = express();
const port = process.env.PORT || 3000;

// 1. Configure CORS Middleware for cross-origin requests
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Dynamic or explicit headers - avoiding wildcard '*' when credentials mode is enabled
  const requestedHeaders = req.headers["access-control-request-headers"];
  const allowedHeaders = requestedHeaders || "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-tenant-id, x-client-subdomain";
  res.setHeader("Access-Control-Allow-Headers", allowedHeaders);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// 2. Configure Body Parsers & Cookie Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. Fallback Middleware ensuring req.body is never undefined
app.use((req, res, next) => {
  if (!req.body) {
    req.body = {};
  }
  next();
});

// 4. Global Tenant Resolver Middleware (populates req.client based on subdomain / x-client-subdomain header)
app.use(tenantResolver);

// 5. Register Central Application Routes (/api)
const routes = require("./routes");
app.use("/api", routes);

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Global Error Handler ensuring CORS headers are present on server errors
app.use((err, req, res, next) => {
  console.error("[Global Error Handler]:", err);
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// Start Express server if run directly
if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);

    // In local development, auto-start transcoding and counter-sync workers so everything works in one terminal
    if (process.env.NODE_ENV !== "production") {
      try {
        require("./workers/reelTranscode.worker");
        require("./workers/sync-counters.worker");
        console.log("[Local Dev] Background workers (Transcoder & Sync Counters) initialized.");
      } catch (err) {
        console.warn("[Local Dev] Warning initializing workers:", err.message);
      }
    }
  });

  // Graceful Shutdown Cleanup Handler (PM2 restart / SIGTERM / SIGINT)
  const RedisUtil = require("./utils/redis.util");
  const gracefulShutdown = async (signal) => {
    console.log(`[App] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log("[App] HTTP server closed.");
      await RedisUtil.closeRedis();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

module.exports = app;
