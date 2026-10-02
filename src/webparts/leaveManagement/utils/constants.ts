// ────────────────────────────────────────────────────────────
// Leave Types
// ────────────────────────────────────────────────────────────
export const LEAVE_TYPES = [
  { label: "Casual Leave", value: "Casual Leave", daysAllowed: 10 },
  { label: "Sick Leave", value: "Sick Leave", daysAllowed: 8 },
  { label: "Earned Leave", value: "Earned Leave", daysAllowed: 20 },
  { label: "Unpaid Leave", value: "Unpaid Leave", daysAllowed: 0 },
];

export const COMPANY_HOLIDAYS = [
  { date: "2026-01-26", name: "Republic Day" },
  { date: "2026-08-15", name: "Independence Day" },
  { date: "2026-10-02", name: "Gandhi Jayanti" },
  { date: "2026-12-25", name: "Christmas" },
];

// ────────────────────────────────────────────────────────────
// Half Day Types
// ────────────────────────────────────────────────────────────
export const HALF_DAY_TYPES = [
  { label: "Full Day", value: "None" },
  { label: "First Half (AM)", value: "FirstHalf" },
  { label: "Second Half (PM)", value: "SecondHalf" },
] as const;

// ────────────────────────────────────────────────────────────
// Status Types
// ────────────────────────────────────────────────────────────
export const LEAVE_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

// ────────────────────────────────────────────────────────────
// Status Colors
// ────────────────────────────────────────────────────────────
export const STATUS_COLORS: Record<string, string> = {
  Pending: "#d97706",
  Approved: "#16a34a",
  Rejected: "#dc2626",
};

export const STATUS_BG_COLORS: Record<string, string> = {
  Pending: "#fef3c7",
  Approved: "#dcfce7",
  Rejected: "#fee2e2",
};

// ────────────────────────────────────────────────────────────
// Role Types
// ────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
} as const;

// ────────────────────────────────────────────────────────────
// Departments
// ────────────────────────────────────────────────────────────
export const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Marketing",
  "HR",
  "Finance",
  "Operations",
  "Product",
];

// ────────────────────────────────────────────────────────────
// Messages
// ────────────────────────────────────────────────────────────
export const MESSAGES = {
  LEAVE_APPLIED: "Leave request submitted successfully",
  LEAVE_APPROVED: "Leave approved successfully",
  LEAVE_REJECTED: "Leave rejected successfully",
  LEAVE_DELETED: "Leave deleted successfully",
  LEAVE_CANCELLED: "Leave request cancelled successfully",
  ERROR_FETCHING: "Error fetching data. Please try again.",
  ERROR_APPLYING: "Error applying leave. Please check your inputs.",
  ERROR_CANCELLING: "Error cancelling leave. Please try again.",
  SUCCESS: "Operation completed successfully",
  ERROR: "An error occurred. Please try again.",
};
