const pool = require("../src/config/db.config");
const fs = require("fs");
const path = require("path");

async function runMigration010() {
  const connection = await pool.getConnection();
  try {
    console.log("Starting Migration 010: Convert Tables to utf8mb4 for Arabic support...");

    const sqlPath = path.join(__dirname, "../src/db/migrations/010_convert_charset_utf8mb4.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing statement:\n${statement}\n`);
      await connection.query(statement);
    }

    console.log("Migration 010 executed successfully!");

    // Verify reels table charset
    const [tableInfo] = await connection.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reels'
    `);
    console.log("Verified Reels Table Collation:", tableInfo[0]);
  } catch (err) {
    console.error("Migration 010 failed:", err);
    process.exitCode = 1;
  } finally {
    connection.release();
    process.exit();
  }
}

runMigration010();
