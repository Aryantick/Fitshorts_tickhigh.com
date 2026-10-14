const pool = require("../../../config/db.config");

/**
 * High-Production Optimized Categories List
 * Fetches categories master list, then maps counts via grouped category_id index.
 */
async function findAllCategories() {
  const [categories] = await pool.query(`
    SELECT * FROM categories ORDER BY display_order ASC, name ASC
  `);

  if (categories.length === 0) return [];

  const [countRows] = await pool.query(`
    SELECT category_id, COUNT(*) AS count
    FROM reels
    WHERE category_id IS NOT NULL
    GROUP BY category_id
  `);

  const countMap = new Map();
  countRows.forEach((r) => countMap.set(r.category_id, Number(r.count)));

  return categories.map((c) => ({
    ...c,
    reel_count: countMap.get(c.id) || 0,
  }));
}

async function createCategory({ name, slug, description, iconUrl, displayOrder = 0 }) {
  const [result] = await pool.query(
    "INSERT INTO categories (name, slug, description, icon_url, display_order, is_active) VALUES (?, ?, ?, ?, ?, 1)",
    [name, slug, description, iconUrl, displayOrder]
  );
  return result;
}

async function updateCategory(id, { name, slug, description, iconUrl, displayOrder, isActive }) {
  const [result] = await pool.query(
    `UPDATE categories 
     SET name = COALESCE(?, name),
         slug = COALESCE(?, slug),
         description = COALESCE(?, description),
         icon_url = COALESCE(?, icon_url),
         display_order = COALESCE(?, display_order),
         is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [name, slug, description, iconUrl, displayOrder, isActive, id]
  );
  return result;
}

async function toggleCategoryActive(id) {
  const [result] = await pool.query(
    "UPDATE categories SET is_active = NOT is_active WHERE id = ?",
    [id]
  );
  return result;
}

module.exports = {
  findAllCategories,
  createCategory,
  updateCategory,
  toggleCategoryActive,
};
