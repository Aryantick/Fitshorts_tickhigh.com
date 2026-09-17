const pool = require("../src/config/db.config");
const fs = require("fs");
const path = require("path");

async function runMigration011() {
  const connection = await pool.getConnection();
  try {
    console.log("Starting Migration 011: Add Jordan Zain Tenant...");

    const sqlPath = path.join(__dirname, "../src/db/migrations/011_add_jordan_zain_tenant.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing statement:\n${statement}\n`);
      await connection.query(statement);
    }

    console.log("Migration 011 executed successfully!");

    // Verify insertion
    const [clients] = await connection.query("SELECT * FROM clients WHERE subdomain = 'zajo'");
    console.log("Verified Client:", clients[0]);

    const [configs] = await connection.query("SELECT * FROM telecom_configs WHERE client_id = ?", [
      clients[0]?.id,
    ]);
    console.log("Verified Telecom Config:", configs[0]);
  } catch (err) {
    console.error("Migration 011 failed:", err);
    process.exitCode = 1;
  } finally {
    connection.release();
    process.exit();
  }
}

runMigration011();
