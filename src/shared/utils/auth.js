export const ADMIN_ROLES = ["SUPER_ADMIN", "MANAGER", "VIEW_ONLY_ADMIN", "BUSINESS_HEAD"];
export const CRE_ROLES = ["CLIENT_RELATIONSHIP_EXECUTIVE", "LEAD_OPERATION"];
export const EMPLOYEE_ROLES = ["EMPLOYEE"];
export const SUPERVISOR_ROLES = ["SITE_SUPERVISOR"];

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    return {};
  }
};

export const getInternalToken = () => localStorage.getItem("token");
export const getClientToken = () => localStorage.getItem("clientToken");

export const clearInternalAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const clearClientAuth = () => {
  localStorage.removeItem("clientToken");
};

export const clearAllAuth = () => {
  clearInternalAuth();
  clearClientAuth();
};

export const getDefaultInternalRoute = (user = getStoredUser()) => {
  if (ADMIN_ROLES.includes(user.role)) return "/admin/dashboard";
  if (CRE_ROLES.includes(user.role)) return "/cre/reports";
  if (EMPLOYEE_ROLES.includes(user.role)) return "/employee";
  if (SUPERVISOR_ROLES.includes(user.role)) return "/supervisor/dashboard";
  return "/login";
};

export const getDefaultAppRoute = () => {
  if (getClientToken()) return "/client";
  if (getInternalToken()) return getDefaultInternalRoute();
  return "/login";
};

export const hasAllowedRole = (allowedRoles, user = getStoredUser()) =>
  allowedRoles.includes(user.role);
