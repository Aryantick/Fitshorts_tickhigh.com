const pool = require("../src/config/db.config");
const fs = require("fs");
const path = require("path");

async function runMigration009() {
  const connection = await pool.getConnection();
  try {
    console.log("Starting Migration 009: Add Jordan Orange Tenant...");

    const sqlPath = path.join(__dirname, "../src/db/migrations/009_add_jordan_orange_tenant.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing statement:\n${statement}\n`);
      await connection.query(statement);
    }

    console.log("Migration 009 executed successfully!");

    // Verify insertion
    const [clients] = await connection.query("SELECT * FROM clients WHERE subdomain = 'orjo'");
    console.log("Verified Client:", clients[0]);

    const [configs] = await connection.query("SELECT * FROM telecom_configs WHERE client_id = ?", [
      clients[0]?.id,
    ]);
    console.log("Verified Telecom Config:", configs[0]);
  } catch (err) {
    console.error("Migration 009 failed:", err);
    process.exitCode = 1;
  } finally {
    connection.release();
    process.exit();
  }
}

runMigration009();
