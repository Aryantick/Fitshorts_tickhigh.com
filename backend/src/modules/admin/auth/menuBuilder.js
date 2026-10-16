const AdminMenusRepository = require("../menus/adminMenus.repository");

/**
 * Builds dynamic menus directly from the MySQL "admin_menus" table with granular
 * CRUD permissions filtered according to the admin role and permissions.
 */
async function buildAdminMenus(roleSlug, permissions = {}) {
  const isSuperAdmin =
    roleSlug === "super_admin" ||
    roleSlug === "superadmin" ||
    Boolean(permissions?.actions?.all);

  const allowedPages = Array.isArray(permissions?.pages) ? permissions.pages : ["dashboard"];
  const isReadOnly = Boolean(permissions?.actions?.isReadOnly);
  const actions = permissions?.actions || {};

  // 1. Query the database table for all active menus
  const dbMenus = await AdminMenusRepository.findAllActiveMenus();

  // 2. Separate root menus and submenus map
  const rootMenus = dbMenus.filter((m) => m.parent_id === null);
  const childMenusMap = {};
  for (const m of dbMenus) {
    if (m.parent_id !== null) {
      if (!childMenusMap[m.parent_id]) childMenusMap[m.parent_id] = [];
      childMenusMap[m.parent_id].push(m);
    }
  }

  function resolveItem(row) {
    const isAll = isSuperAdmin || allowedPages.includes("*");
    const hasAccess =
      isAll ||
      allowedPages.includes(row.page_key) ||
      allowedPages.includes(String(row.id)) ||
      (row.path && allowedPages.includes(row.path.replace(/^\//, "")));

    const childrenRows = childMenusMap[row.id] || [];
    const allowedChildren = childrenRows.map(resolveItem).filter(Boolean);

    // If item has submenus in the database
    if (childrenRows.length > 0) {
      if (allowedChildren.length > 0 || isAll) {
        return {
          id: String(row.id),
          label: row.label,
          path: row.path,
          icon: row.icon,
          orderIndex: row.order_index,
          permissions: {
            canView: true,
            canCreate: isSuperAdmin || !isReadOnly,
            canUpdate: isSuperAdmin || !isReadOnly,
            canDelete: isSuperAdmin || !isReadOnly,
          },
          children: allowedChildren,
        };
      }
      return null;
    }

    if (!hasAccess) {
      return null;
    }

    // Granular CRUD logic per page
    let canCreate = isSuperAdmin || (!isReadOnly && (actions.all || true));
    let canUpdate = isSuperAdmin || (!isReadOnly && (actions.all || true));
    let canDelete = isSuperAdmin || (!isReadOnly && (actions.all || false));

    if (row.page_key === "roles") {
      canCreate = isSuperAdmin || Boolean(actions.canManageRoles);
      canUpdate = isSuperAdmin || Boolean(actions.canManageRoles);
      canDelete = isSuperAdmin || Boolean(actions.canManageRoles);
    } else if (row.page_key === "moderation" || row.page_key === "reels") {
      canCreate = false;
      canUpdate = isSuperAdmin || Boolean(actions.canApproveReel || actions.canRejectReel || actions.canSuspendReel);
      canDelete = isSuperAdmin || Boolean(actions.canRejectReel);
    } else if (row.page_key === "admins") {
      canCreate = isSuperAdmin || Boolean(actions.canManageAdmins);
      canUpdate = isSuperAdmin || Boolean(actions.canManageAdmins);
      canDelete = isSuperAdmin || Boolean(actions.canManageAdmins);
    } else if (row.page_key === "music") {
      canCreate = isSuperAdmin || Boolean(actions.canBulkUploadMusic);
      canUpdate = isSuperAdmin || Boolean(actions.canBulkUploadMusic);
      canDelete = isSuperAdmin || Boolean(actions.canBulkUploadMusic);
    } else if (row.page_key === "categories") {
      canCreate = isSuperAdmin || Boolean(actions.canManageCategories);
      canUpdate = isSuperAdmin || Boolean(actions.canManageCategories);
      canDelete = isSuperAdmin || Boolean(actions.canManageCategories);
    }

    return {
      id: String(row.id),
      label: row.label,
      path: row.path,
      icon: row.icon,
      orderIndex: row.order_index,
      permissions: {
        canView: true,
        canCreate: Boolean(canCreate),
        canUpdate: Boolean(canUpdate),
        canDelete: Boolean(canDelete),
      },
    };
  }

  return rootMenus.map(resolveItem).filter(Boolean);
}

module.exports = {
  buildAdminMenus,
};
