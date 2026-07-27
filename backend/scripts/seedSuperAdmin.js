const bcrypt = require("bcrypt");
const pool = require("../src/config/db.config");

async function seedSuperAdmin() {
  try {
    const username = "superadmin";
    const email = "superadmin@tickhigh.com";
    const plainPassword = "ChangeThisPassword123!";
    const role = "super_admin";

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const [result] = await pool.query(
      "INSERT INTO admins (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [username, email, passwordHash, role],
    );

    console.log(" Super admin created successfully. Insert ID:", result.insertId);
    process.exit(0);
  } catch (error) {
    console.error(" Error seeding super admin:", error.message);
    process.exit(1);
  }
}

seedSuperAdmin();