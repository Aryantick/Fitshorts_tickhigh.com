const express = require("express");
const cookieParser = require("cookie-parser");
const tenantResolver = require("./middlewares/tenantResolver.middleware");

const app = express();
const port = process.env.PORT || 3000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Ensure req.body is never undefined regardless of Content-Type
app.use((req, res, next) => {
  if (!req.body) {
    req.body = {};
  }
  next();
});

// Global Tenant Resolver Middleware (populates req.client based on subdomain)
app.use(tenantResolver);

const routes = require("./routes");
app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
