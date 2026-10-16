const AdminMenusRepository = require("./adminMenus.repository");
const apiResponse = require("../../../utils/apiResponse");

class AdminMenusController {
  /**
   * Get all menus (tree structure or flat list)
   */
  async getMenus(req, res) {
    try {
      const menus = await AdminMenusRepository.findAllMenus();
      return apiResponse(res, 200, "Menus fetched successfully", menus);
    } catch (err) {
      return apiResponse(res, 500, err.message, null);
    }
  }

  /**
   * Create new menu or submenu (Strictly Super Admin only)
   */
  async createMenu(req, res) {
    try {
      // Guard: strictly ensure only super_admin can create
      if (req.admin?.role !== "super_admin") {
        return apiResponse(res, 403, "Permission denied: Only Super Administrator can create menus or submenus.", null);
      }

      const { label, path, icon, page_key, parent_id, order_index } = req.body;
      if (!label || !page_key) {
        return apiResponse(res, 400, "label and page_key are required", null);
      }

      const newMenu = await AdminMenusRepository.createMenu({
        label: label.trim(),
        path: path ? path.trim() : null,
        icon: icon ? icon.trim() : "dashboard",
        page_key: page_key.trim(),
        parent_id: parent_id ? Number(parent_id) : null,
        order_index: order_index ? Number(order_index) : 0,
      });

      return apiResponse(res, 201, "Menu created successfully", newMenu);
    } catch (err) {
      return apiResponse(res, 500, err.message, null);
    }
  }

  /**
   * Update existing menu/submenu (Strictly Super Admin only)
   */
  async updateMenu(req, res) {
    try {
      if (req.admin?.role !== "super_admin") {
        return apiResponse(res, 403, "Permission denied: Only Super Administrator can update menus or submenus.", null);
      }

      const { id } = req.params;
      const updated = await AdminMenusRepository.updateMenu(Number(id), req.body);
      return apiResponse(res, 200, "Menu updated successfully", updated);
    } catch (err) {
      return apiResponse(res, 500, err.message, null);
    }
  }

  /**
   * Delete a menu (Strictly Super Admin only)
   */
  async deleteMenu(req, res) {
    try {
      if (req.admin?.role !== "super_admin") {
        return apiResponse(res, 403, "Permission denied: Only Super Administrator can delete menus or submenus.", null);
      }

      const { id } = req.params;
      await AdminMenusRepository.deleteMenu(Number(id));
      return apiResponse(res, 200, "Menu deleted successfully", { id: Number(id) });
    } catch (err) {
      return apiResponse(res, 500, err.message, null);
    }
  }
}

module.exports = new AdminMenusController();
