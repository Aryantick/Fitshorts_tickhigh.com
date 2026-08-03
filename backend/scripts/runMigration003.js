const pool = require("../src/config/db.config");
const fs = require("fs");
const path = require("path");

async function runMigration003() {
  const connection = await pool.getConnection();
  try {
    console.log("Starting Migration 003...");

    // 1. Execute SQL schema file statements
    const sqlPath = path.join(__dirname, "../src/db/migrations/003_multi_tenant_schema.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Split statements by semicolon
    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log("Created clients, telecom_configs, and user_client_relations tables & default rows.");

    // 2. Safely ALTER user_subscriptions
    const [subCols] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_subscriptions' AND COLUMN_NAME = 'client_id'`
    );
    if (subCols.length === 0) {
      await connection.query(
        `ALTER TABLE user_subscriptions ADD COLUMN client_id BIGINT NOT NULL DEFAULT 1 AFTER user_id`
      );
      await connection.query(
        `ALTER TABLE user_subscriptions ADD CONSTRAINT fk_user_subscriptions_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE`
      );
      console.log("Added client_id column and foreign key to user_subscriptions.");
    } else {
      console.log("client_id column already exists in user_subscriptions.");
    }

    // 3. Safely ALTER reels
    const [reelCols] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reels' AND COLUMN_NAME = 'client_id'`
    );
    if (reelCols.length === 0) {
      await connection.query(
        `ALTER TABLE reels ADD COLUMN client_id BIGINT NOT NULL DEFAULT 1 AFTER user_id`
      );
      await connection.query(
        `ALTER TABLE reels ADD CONSTRAINT fk_reels_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE`
      );
      console.log("Added client_id column and foreign key to reels.");
    } else {
      console.log("client_id column already exists in reels.");
    }

    // Backfill reels client_id with default client ID (1)
    await connection.query(`UPDATE reels SET client_id = 1 WHERE client_id IS NULL OR client_id = 0`);
    console.log("Backfilled existing reels with default client_id (1).");

    console.log("Migration 003 completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 003 failed:", error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

runMigration003();
