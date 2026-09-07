const pool = require("../src/config/db.config");
const fs = require("fs");
const path = require("path");

async function runMigration003() {
  const connection = await pool.getConnection();
  try {
    console.log("Starting Full Database Initialization & Migration...");

    // Helper to execute SQL file statements
    const executeSqlFile = async (fileName) => {
      const sqlPath = path.join(__dirname, `../src/db/migrations/${fileName}`);
      if (!fs.existsSync(sqlPath)) return;
      console.log(`Executing ${fileName}...`);
      const sqlContent = fs.readFileSync(sqlPath, "utf8");
      const statements = sqlContent
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (err) {
          // Ignore duplicate column / table / constraint errors if re-run
          if (
            err.code !== "ER_TABLE_EXISTS_ERROR" &&
            err.code !== "ER_DUP_FIELDNAME" &&
            err.code !== "ER_DUP_KEYNAME"
          ) {
            throw err;
          }
        }
      }
    };

    // 1. Run initial base schema 001 if needed
    await executeSqlFile("001_init_schema.sql");

    // 2. Run update schema 002 if needed
    await executeSqlFile("002_update_schema.sql");

    // 3. Run multi-tenant schema 003, dialog SL tenant 006, and msisdn size fix 007
    await executeSqlFile("003_multi_tenant_schema.sql");
    await executeSqlFile("006_add_dialog_sl_tenant.sql");
    await executeSqlFile("007_expand_msisdn_column.sql");
    console.log("Created clients, telecom_configs, and user_client_relations tables & default rows.");

    // 4. Safely ALTER user_subscriptions
    const [subCols] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_subscriptions' AND COLUMN_NAME = 'client_id'`
    );
    if (subCols.length === 0) {
      await connection.query(
        `ALTER TABLE user_subscriptions ADD COLUMN client_id BIGINT NOT NULL DEFAULT 1 AFTER user_id`
      );
      try {
        await connection.query(
          `ALTER TABLE user_subscriptions ADD CONSTRAINT fk_user_subscriptions_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE`
        );
      } catch (e) {}
      console.log("Added client_id column and foreign key to user_subscriptions.");
    } else {
      console.log("client_id column already exists in user_subscriptions.");
    }

    // 5. Safely ALTER reels
    const [reelCols] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reels' AND COLUMN_NAME = 'client_id'`
    );
    if (reelCols.length === 0) {
      await connection.query(
        `ALTER TABLE reels ADD COLUMN client_id BIGINT NOT NULL DEFAULT 1 AFTER user_id`
      );
      try {
        await connection.query(
          `ALTER TABLE reels ADD CONSTRAINT fk_reels_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE`
        );
      } catch (e) {}
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
