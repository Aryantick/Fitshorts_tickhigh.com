const CategoriesService = require("./categories.service");
const apiResponse = require("../../../utils/apiResponse");

async function getCategories(req, res) {
  try {
    const categories = await CategoriesService.getCategories();
    return apiResponse(res, 200, "Categories fetched successfully", categories);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function createCategory(req, res) {
  try {
    const { name, slug, description, iconUrl, displayOrder } = req.body;
    if (!name || !slug) {
      return apiResponse(res, 400, "Category name and slug are required", null);
    }

    const adminId = req.admin.adminId;
    const adminUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await CategoriesService.addCategory(
      { name, slug, description, iconUrl, displayOrder: displayOrder || 0 },
      adminId,
      adminUsername,
      ipAddress
    );
    return apiResponse(res, 201, "Category created successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    const adminId = req.admin.adminId;
    const adminUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await CategoriesService.editCategory(id, categoryData, adminId, adminUsername, ipAddress);
    return apiResponse(res, 200, "Category updated successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function toggleCategory(req, res) {
  try {
    const { id } = req.params;
    const result = await CategoriesService.toggleCategory(id);
    return apiResponse(res, 200, "Category status toggled successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  toggleCategory,
};
