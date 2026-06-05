import { IMenuItem } from "../interfaces/IMenuItem";

export const menuItems: IMenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    roles: ["Admin", "Manager", "Employee"],
  },

  {
    key: "applyLeave",
    label: "Apply Leave",
    path: "/apply-leave",
    roles: ["Employee"],
  },

  {
    key: "leaveRequests",
    label: "Leave Requests",
    path: "/leave-list",
    roles: ["Admin", "Manager"],
  },

  {
    key: "employees",
    label: "Employees",
    path: "/employees",
    roles: ["Admin"],
  },
];