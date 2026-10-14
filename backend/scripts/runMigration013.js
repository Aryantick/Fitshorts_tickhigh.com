const pool = require("../src/config/db.config");
const fs = require("fs");
const path = require("path");

async function columnExists(connection, tableName, columnName) {
  const [cols] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return cols.length > 0;
}

async function indexExists(connection, tableName, indexName) {
  const [indexes] = await connection.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  return indexes.length > 0;
}

async function runMigration013() {
  const connection = await pool.getConnection();
  try {
    console.log("=== Starting Migration 013: Dynamic Admin Roles & Client Scopes ===");

    // 1. Execute SQL script for admin_roles table and 5 default system roles
    const sqlPath = path.join(__dirname, "../src/db/migrations/013_admin_roles_and_client_scopes.sql");
    if (fs.existsSync(sqlPath)) {
      console.log("Applying 013_admin_roles_and_client_scopes.sql...");
      const sqlContent = fs.readFileSync(sqlPath, "utf8");
      const statements = sqlContent
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (err) {
          if (
            err.code !== "ER_TABLE_EXISTS_ERROR" &&
            err.code !== "ER_DUP_FIELDNAME" &&
            err.code !== "ER_DUP_KEYNAME"
          ) {
            throw err;
          }
        }
      }
      console.log("✓ admin_roles table created and 5 system roles seeded.");
    }

    // 2. Alter admins table: Add client_id if missing
    if (!(await columnExists(connection, "admins", "client_id"))) {
      console.log("Adding client_id column to admins table...");
      await connection.query(
        "ALTER TABLE admins ADD COLUMN client_id BIGINT NULL AFTER role"
      );
      console.log("✓ client_id column added to admins.");
    } else {
      console.log("• client_id already exists in admins.");
    }

    // 3. Alter admins table: Add role_id if missing
    if (!(await columnExists(connection, "admins", "role_id"))) {
      console.log("Adding role_id column to admins table...");
      await connection.query(
        "ALTER TABLE admins ADD COLUMN role_id INT NULL AFTER client_id"
      );
      console.log("✓ role_id column added to admins.");
    } else {
      console.log("• role_id already exists in admins.");
    }

    // 4. Add index on admins.client_id
    if (!(await indexExists(connection, "admins", "idx_admins_client"))) {
      try {
        await connection.query(
          "ALTER TABLE admins ADD INDEX idx_admins_client (client_id)"
        );
        console.log("✓ idx_admins_client index added.");
      } catch (e) {}
    }

    // 5. Backfill existing admins
    await connection.query(
      `UPDATE admins SET role_id = 1, role = 'super_admin' WHERE (role_id IS NULL OR role_id = 0) AND role = 'super_admin'`
    );
    await connection.query(
      `UPDATE admins SET role_id = 3, role = 'moderator' WHERE (role_id IS NULL OR role_id = 0) AND role = 'moderator'`
    );
    console.log("✓ Existing admins backfilled with appropriate role_id.");

    console.log("=== Migration 013 Completed Successfully! ===");
    process.exit(0);
  } catch (err) {
    console.error("Migration 013 Failed:", err);
    process.exit(1);
  } finally {
    connection.release();
  }
}

runMigration013();
