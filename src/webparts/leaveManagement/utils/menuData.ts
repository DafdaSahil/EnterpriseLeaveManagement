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
    key: "myLeaveHistory",
    label: "My Leave History",
    path: "/my-leave-history",
    roles: ["Employee"],
  },

  {
    key: "holidayCalendar",
    label: "Holiday Calendar",
    path: "/holiday-calendar",
    roles: ["Admin", "Manager", "Employee"],
  },

  {
    key: "leavePolicy",
    label: "Leave Policy",
    path: "/leave-policy",
    roles: ["Admin", "Manager", "Employee"],
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

  {
    key: "profile",
    label: "My Profile",
    path: "/profile",
    roles: ["Admin", "Manager", "Employee"],
  },
];