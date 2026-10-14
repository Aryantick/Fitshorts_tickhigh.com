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

async function runMigration012() {
  const connection = await pool.getConnection();
  try {
    console.log("=== Starting Migration 012: Admin Portal Phase 1 Schema Upgrades ===");

    // 1. Execute SQL script for categories and admin_audit_logs
    const sqlPath = path.join(__dirname, "../src/db/migrations/012_admin_phase1_complete_schema.sql");
    if (fs.existsSync(sqlPath)) {
      console.log("Applying 012_admin_phase1_complete_schema.sql...");
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
      console.log("✓ Categories and admin_audit_logs tables created / verified.");
    }

    // 2. Fix notifications table: Add client_id if missing
    if (!(await columnExists(connection, "notifications", "client_id"))) {
      console.log("Adding client_id column to notifications table...");
      await connection.query(
        "ALTER TABLE notifications ADD COLUMN client_id BIGINT NULL AFTER user_id"
      );
      console.log("✓ client_id column added to notifications.");
    } else {
      console.log("• client_id already exists in notifications.");
    }

    if (!(await indexExists(connection, "notifications", "idx_notifications_client_user"))) {
      try {
        await connection.query(
          "ALTER TABLE notifications ADD INDEX idx_notifications_client_user (client_id, user_id)"
        );
        console.log("✓ idx_notifications_client_user index added.");
      } catch (e) {}
    }

    // 3. Update reels table columns
    if (!(await columnExists(connection, "reels", "category_id"))) {
      console.log("Adding category_id column to reels table...");
      await connection.query(
        "ALTER TABLE reels ADD COLUMN category_id BIGINT UNSIGNED NULL AFTER description"
      );
      console.log("✓ category_id added to reels.");
    } else {
      console.log("• category_id already exists in reels.");
    }

    if (!(await columnExists(connection, "reels", "share_count"))) {
      console.log("Adding share_count column to reels table...");
      await connection.query(
        "ALTER TABLE reels ADD COLUMN share_count BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER like_count"
      );
      console.log("✓ share_count added to reels.");
    } else {
      console.log("• share_count already exists in reels.");
    }

    if (!(await columnExists(connection, "reels", "save_count"))) {
      console.log("Adding save_count column to reels table...");
      await connection.query(
        "ALTER TABLE reels ADD COLUMN save_count BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER share_count"
      );
      console.log("✓ save_count added to reels.");
    } else {
      console.log("• save_count already exists in reels.");
    }

    if (!(await columnExists(connection, "reels", "is_featured"))) {
      console.log("Adding is_featured column to reels table...");
      await connection.query(
        "ALTER TABLE reels ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER save_count"
      );
      console.log("✓ is_featured added to reels.");
    } else {
      console.log("• is_featured already exists in reels.");
    }

    if (!(await columnExists(connection, "reels", "pinned_at"))) {
      console.log("Adding pinned_at column to reels table...");
      await connection.query(
        "ALTER TABLE reels ADD COLUMN pinned_at DATETIME NULL AFTER is_featured"
      );
      console.log("✓ pinned_at added to reels.");
    } else {
      console.log("• pinned_at already exists in reels.");
    }

    if (!(await columnExists(connection, "reels", "updated_at"))) {
      console.log("Adding updated_at column to reels table...");
      await connection.query(
        "ALTER TABLE reels ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
      );
      console.log("✓ updated_at added to reels.");
    } else {
      console.log("• updated_at already exists in reels.");
    }

    // Update reels status ENUM to include 'suspended'
    console.log("Updating reels status ENUM to include 'suspended'...");
    await connection.query(
      "ALTER TABLE reels MODIFY COLUMN status ENUM('pending_review','approved','rejected','published','deleted','suspended') NOT NULL DEFAULT 'pending_review'"
    );
    console.log("✓ reels status ENUM updated.");

    // Add indexes to reels if missing
    if (!(await indexExists(connection, "reels", "idx_reels_status_created"))) {
      try {
        await connection.query(
          "ALTER TABLE reels ADD INDEX idx_reels_status_created (status, created_at)"
        );
        console.log("✓ idx_reels_status_created index added to reels.");
      } catch (e) {}
    }

    if (!(await indexExists(connection, "reels", "idx_reels_client_status"))) {
      try {
        await connection.query(
          "ALTER TABLE reels ADD INDEX idx_reels_client_status (client_id, status)"
        );
        console.log("✓ idx_reels_client_status index added to reels.");
      } catch (e) {}
    }

    // 4. Update users table columns (moderation)
    if (!(await columnExists(connection, "users", "is_blocked"))) {
      console.log("Adding is_blocked column to users table...");
      await connection.query(
        "ALTER TABLE users ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active"
      );
      console.log("✓ is_blocked added to users.");
    } else {
      console.log("• is_blocked already exists in users.");
    }

    if (!(await columnExists(connection, "users", "block_reason"))) {
      console.log("Adding block_reason column to users table...");
      await connection.query(
        "ALTER TABLE users ADD COLUMN block_reason VARCHAR(255) NULL AFTER is_blocked"
      );
      console.log("✓ block_reason added to users.");
    } else {
      console.log("• block_reason already exists in users.");
    }

    if (!(await columnExists(connection, "users", "blocked_at"))) {
      console.log("Adding blocked_at column to users table...");
      await connection.query(
        "ALTER TABLE users ADD COLUMN blocked_at DATETIME NULL AFTER block_reason"
      );
      console.log("✓ blocked_at added to users.");
    } else {
      console.log("• blocked_at already exists in users.");
    }

    console.log("=== Migration 012 Completed Successfully! ===");
    process.exit(0);
  } catch (err) {
    console.error("Migration 012 Failed:", err);
    process.exit(1);
  } finally {
    connection.release();
  }
}

runMigration012();
