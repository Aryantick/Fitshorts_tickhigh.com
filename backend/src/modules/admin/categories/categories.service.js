const CategoriesRepository = require("./categories.repository");
const AuditRepository = require("../audit/audit.repository");
const { AUDIT_ACTIONS } = require("../../../constants/enums");

async function getCategories() {
  return await CategoriesRepository.findAllCategories();
}

async function addCategory(categoryData, adminId, adminUsername = null, ipAddress = null) {
  const result = await CategoriesRepository.createCategory(categoryData);

  try {
    await AuditRepository.createAuditLog({
      adminId,
      adminUsername,
      action: AUDIT_ACTIONS.CATEGORY_CREATED,
      targetType: "category",
      targetId: result.insertId,
      details: categoryData,
      ipAddress,
    });
  } catch (err) {}

  return { id: result.insertId, ...categoryData };
}

async function editCategory(id, categoryData, adminId, adminUsername = null, ipAddress = null) {
  await CategoriesRepository.updateCategory(id, categoryData);

  try {
    await AuditRepository.createAuditLog({
      adminId,
      adminUsername,
      action: AUDIT_ACTIONS.CATEGORY_UPDATED,
      targetType: "category",
      targetId: id,
      details: categoryData,
      ipAddress,
    });
  } catch (err) {}

  return { success: true, message: "Category updated successfully" };
}

async function toggleCategory(id) {
  await CategoriesRepository.toggleCategoryActive(id);
  return { success: true, message: "Category active status toggled" };
}

module.exports = {
  getCategories,
  addCategory,
  editCategory,
  toggleCategory,
};
