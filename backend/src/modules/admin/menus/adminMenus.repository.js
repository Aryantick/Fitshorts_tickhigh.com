const pool = require("../../../config/db.config");

class AdminMenusRepository {
  /**
   * Fetch all active menus for client navigation
   */
  async findAllActiveMenus() {
    const [rows] = await pool.query(
      `SELECT id, label, path, icon, page_key, parent_id, order_index, is_active 
       FROM admin_menus 
       WHERE is_active = 1 
       ORDER BY order_index ASC, id ASC`
    );
    return rows;
  }

  /**
   * Fetch all menus (including inactive) for Super Admin management
   */
  async findAllMenus() {
    const [rows] = await pool.query(
      `SELECT id, label, path, icon, page_key, parent_id, order_index, is_active, created_at, updated_at 
       FROM admin_menus 
       ORDER BY order_index ASC, id ASC`
    );
    return rows;
  }

  /**
   * Find single menu by ID
   */
  async findMenuById(id) {
    const [rows] = await pool.query("SELECT * FROM admin_menus WHERE id = ?", [id]);
    return rows[0] || null;
  }

  /**
   * Create a new menu or submenu
   */
  async createMenu({ label, path, icon = "dashboard", page_key, parent_id = null, order_index = 0 }) {
    const [result] = await pool.query(
      `INSERT INTO admin_menus (label, path, icon, page_key, parent_id, order_index, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [label, path || null, icon, page_key, parent_id || null, order_index || 0]
    );
    return { id: result.insertId, label, path, icon, page_key, parent_id, order_index };
  }

  /**
   * Update an existing menu or submenu
   */
  async updateMenu(id, { label, path, icon, page_key, parent_id, order_index, is_active }) {
    const fields = [];
    const values = [];

    if (label !== undefined) { fields.push("label = ?"); values.push(label); }
    if (path !== undefined) { fields.push("path = ?"); values.push(path || null); }
    if (icon !== undefined) { fields.push("icon = ?"); values.push(icon); }
    if (page_key !== undefined) { fields.push("page_key = ?"); values.push(page_key); }
    if (parent_id !== undefined) { fields.push("parent_id = ?"); values.push(parent_id || null); }
    if (order_index !== undefined) { fields.push("order_index = ?"); values.push(order_index); }
    if (is_active !== undefined) { fields.push("is_active = ?"); values.push(is_active); }

    if (fields.length === 0) return await this.findMenuById(id);

    values.push(id);
    await pool.query(`UPDATE admin_menus SET ${fields.join(", ")} WHERE id = ?`, values);
    return await this.findMenuById(id);
  }

  /**
   * Delete a menu (cascades to submenus)
   */
  async deleteMenu(id) {
    const [result] = await pool.query("DELETE FROM admin_menus WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new AdminMenusRepository();
