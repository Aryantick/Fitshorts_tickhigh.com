const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const pool = require("../src/config/db.config");
const fs = require("fs");

async function runMigration014() {
  const connection = await pool.getConnection();
  try {
    console.log("=== Starting Migration 014: Dynamic Admin Menus Table ===");

    const sqlPath = path.join(__dirname, "../src/db/migrations/014_admin_dynamic_menus.sql");
    if (fs.existsSync(sqlPath)) {
      console.log("Applying 014_admin_dynamic_menus.sql...");
      const sqlContent = fs.readFileSync(sqlPath, "utf8");
      const statements = sqlContent
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (err) {
          console.warn("Statement warning/error:", err.message);
        }
      }
    }

    const [rows] = await connection.query("SELECT id, label, path, icon, parent_id, order_index FROM admin_menus ORDER BY order_index ASC");
    console.log("=== Migration 014 Complete! Seeded Menus in Database: ===");
    console.table(rows);
  } catch (error) {
    console.error("Migration 014 failed:", error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration014();
