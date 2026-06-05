// import { LEAVE_TYPES } from "./constants";

// ────────────────────────────────────────────────────────────
// Email Validation
// ────────────────────────────────────────────────────────────
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ────────────────────────────────────────────────────────────
// Form Validation
// ────────────────────────────────────────────────────────────
export interface IValidationError {
  field: string;
  message: string;
}

export const validateLeaveForm = (formData: {
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}): IValidationError[] => {
  const errors: IValidationError[] = [];

  // Validate leave type
  if (!formData.leaveType || formData.leaveType.trim() === "") {
    errors.push({
      field: "leaveType",
      message: "Please select a leave type",
    });
  }

  // Validate start date
  if (!formData.startDate || formData.startDate.trim() === "") {
    errors.push({
      field: "startDate",
      message: "Please select a start date",
    });
  }

  // Validate end date
  if (!formData.endDate || formData.endDate.trim() === "") {
    errors.push({
      field: "endDate",
      message: "Please select an end date",
    });
  }

  // Validate date range
  if (formData.startDate && formData.endDate) {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start > end) {
      errors.push({
        field: "endDate",
        message: "End date must be after start date",
      });
    }

    // Check if start date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      errors.push({
        field: "startDate",
        message: "Start date cannot be in the past",
      });
    }
  }

  // Validate reason
  if (!formData.reason || formData.reason.trim() === "") {
    errors.push({
      field: "reason",
      message: "Please provide a reason for your leave",
    });
  }

  if (formData.reason && formData.reason.trim().length < 5) {
    errors.push({
      field: "reason",
      message: "Reason must be at least 5 characters long",
    });
  }

  return errors;
};

// ────────────────────────────────────────────────────────────
// Business Logic Validation
// ────────────────────────────────────────────────────────────
export const validateLeaveBalance = (
  leaveType: string,
  daysRequested: number,
  availableDays: number
): boolean => {
  return availableDays >= daysRequested;
};

export const getValidationMessage = (errors: IValidationError[]): string => {
  if (errors.length === 0) return "";
  if (errors.length === 1) return errors[0].message;
  return `${errors.length} errors found in the form`;
};

// ────────────────────────────────────────────────────────────
// Approval Validation
// ────────────────────────────────────────────────────────────
export const validateApprovalAction = (
  action: string,
  comment?: string
): IValidationError[] => {
  const errors: IValidationError[] = [];

  if (!action || !["Approved", "Rejected"].includes(action)) {
    errors.push({
      field: "action",
      message: "Invalid action. Choose Approved or Rejected.",
    });
  }

  if (action === "Rejected") {
    if (!comment || comment.trim() === "") {
      errors.push({
        field: "comment",
        message: "Please provide a comment for rejection",
      });
    }
  }

  return errors;
};
