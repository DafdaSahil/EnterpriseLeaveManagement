import { IUser } from "../interfaces/IUser";

/**
 * Returns the default redirect path based on user role.
 * - Admin → /employees (admin dashboard)
 * - Manager → /leave-list (manager view)
 * - Employee → /dashboard (employee view)
 */
export const getRoleRedirectPath = (user: IUser): string => {
  switch (user.Role) {
    case "Admin":
      return "/employees";
    case "Manager":
      return "/leave-list";
    case "Employee":
    default:
      return "/dashboard";
  }
};

/**
 * Checks if a user has access to a specific route.
 */
export const hasRouteAccess = (
  user: IUser,
  route: string,
): boolean => {
  const sharedRoutes = [
    "/dashboard",
    "/apply-leave",
    "/my-leave-history",
    "/profile",
  ];

  const referenceRoutes = ["/holiday-calendar", "/leave-policy"];

  const adminRoutes = [
    "/employees",
    "/leave-list",
    ...sharedRoutes,
    ...referenceRoutes,
  ];
  const managerRoutes = ["/leave-list", ...sharedRoutes, ...referenceRoutes];
  const employeeRoutes = [...sharedRoutes, ...referenceRoutes];

  switch (user.Role) {
    case "Admin":
      return adminRoutes.includes(route);
    case "Manager":
      return managerRoutes.includes(route);
    case "Employee":
    default:
      return employeeRoutes.includes(route);
  }
};
