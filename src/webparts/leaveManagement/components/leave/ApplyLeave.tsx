import * as React from "react";
import { useNavigate } from "react-router-dom";
import { DatePicker, DayOfWeek } from "@fluentui/react";
import { AuthContext } from "../../context/AuthContext";
import MainLayout from "../../layout/MainLayout";
import { addLeave, getLeaveBalance } from "../../services/SPService";
import { COMPANY_HOLIDAYS, LEAVE_TYPES, MESSAGES } from "../../utils/constants";
import {
  calculateDays,
  calculateBusinessDays,
  formatDateISO,
  getMinDate,
} from "../../utils/dateUtils";
import { validateLeaveForm, IValidationError } from "../../utils/validation";
import Swal from "sweetalert2";
import "./apply-leave.css";

interface ILeaveForm {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const ApplyLeave = (): JSX.Element => {
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);

  const [formData, setFormData] = React.useState<ILeaveForm>({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [errors, setErrors] = React.useState<IValidationError[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [leaveBalance, setLeaveBalance] = React.useState<{
    [key: string]: { used: number; total: number };
  }>({});
  const [daysCount, setDaysCount] = React.useState(0);

  // Fetch leave balance on component mount
  React.useEffect((): void => {
    const fetchBalance = async (): Promise<void> => {
      if (user?.Email) {
        try {
          const balance = await getLeaveBalance(user.Email);
          setLeaveBalance(balance);
        } catch (error) {
          console.error("Error fetching leave balance:", error);
        }
      }
    };
    fetchBalance().catch((error) => {
      console.error("Error loading leave balance:", error);
    });
  }, [user]);

  // Calculate days when dates change
  React.useEffect((): void => {
    if (formData.startDate && formData.endDate) {
      const days = calculateBusinessDays(formData.startDate, formData.endDate);
      setDaysCount(days);
    } else {
      setDaysCount(0);
    }
  }, [formData.startDate, formData.endDate]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    setErrors((prev) => prev.filter((err) => err.field !== name));
  };

  const handleDateChange = (
    fieldName: "startDate" | "endDate",
    date?: Date | null,
  ): void => {
    const value = date ? formatDateISO(date) : "";
    setFormData((prev) => {
      const nextFormData = {
        ...prev,
        [fieldName]: value,
      };

      if (
        fieldName === "startDate" &&
        nextFormData.endDate &&
        value &&
        new Date(nextFormData.endDate) < new Date(value)
      ) {
        nextFormData.endDate = "";
      }

      return nextFormData;
    });
    setErrors((prev) => prev.filter((err) => err.field !== fieldName));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateLeaveForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      await Swal.fire({
        title: "Validation Error",
        text: "Please fix the errors in the form",
        icon: "error",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
      return;
    }

    // Check leave balance
    const selectedLeaveType = LEAVE_TYPES.find(
      (l) => l.value === formData.leaveType,
    );
    if (selectedLeaveType && leaveBalance[formData.leaveType]) {
      const available =
        selectedLeaveType.daysAllowed - leaveBalance[formData.leaveType].used;
      if (daysCount > available) {
        await Swal.fire({
          title: "Insufficient Balance",
          text: `You only have ${available} days available for ${formData.leaveType}`,
          icon: "warning",
          confirmButtonColor: "#2563eb",
          heightAuto: false,
        });
        return;
      }
    }

    setLoading(true);

    try {
      await addLeave({
        EmployeeEmail: user?.Email || "",
        LeaveType: formData.leaveType,
        StartDate: new Date(formData.startDate),
        EndDate: new Date(formData.endDate),
        Reason: formData.reason,
        Status: "Pending",
      });

      await Swal.fire({
        title: "Success!",
        text: MESSAGES.LEAVE_APPLIED,
        icon: "success",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error applying leave:", error);
      await Swal.fire({
        title: "Error",
        text: MESSAGES.ERROR_APPLYING,
        icon: "error",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: string): string => {
    const error = errors.find((e) => e.field === fieldName);
    return error ? error.message : "";
  };

  const selectedLeaveType = LEAVE_TYPES.find(
    (l) => l.value === formData.leaveType,
  );
  const availableDays =
    selectedLeaveType && leaveBalance[formData.leaveType]
      ? selectedLeaveType.daysAllowed - leaveBalance[formData.leaveType].used
      : 0;
  const totalCalendarDays =
    formData.startDate && formData.endDate
      ? calculateDays(formData.startDate, formData.endDate)
      : 0;
  const excludedDays = Math.max(0, totalCalendarDays - daysCount);
  const holidaysInRange =
    formData.startDate && formData.endDate
      ? COMPANY_HOLIDAYS.filter((holiday) => {
          const holidayDate = new Date(holiday.date);
          return (
            holidayDate >= new Date(formData.startDate) &&
            holidayDate <= new Date(formData.endDate)
          );
        })
      : [];

  return (
    <MainLayout>
      <div className="applyLeaveContainer">
        {/* Page Header */}
        <div className="pageHeader">
          <h1 className="pageTitle">Apply for Leave</h1>
          <p className="pageSubtitle">
            Submit a new leave request to your manager
          </p>
        </div>

        {/* Form Card */}
        <div className="formCard">
          <form onSubmit={handleSubmit} className="leaveForm">
            {/* Leave Type Field */}
            <div className="formGroup">
              <label className="label" htmlFor="leaveType">
                Leave Type <span className="required">*</span>
              </label>
              <select
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleInputChange}
                className={`input ${getFieldError("leaveType") ? "error" : ""}`}
              >
                <option value="">Select a leave type</option>
                {LEAVE_TYPES.map((leave) => (
                  <option key={leave.value} value={leave.value}>
                    {leave.label}
                  </option>
                ))}
              </select>
              {getFieldError("leaveType") && (
                <span className="errorMessage">
                  {getFieldError("leaveType")}
                </span>
              )}
            </div>

            {/* Date Range */}
            <div className="formRow">
              <div className="formGroup">
                <label className="label" htmlFor="startDate">
                  Start Date <span className="required">*</span>
                </label>
                <DatePicker
                  id="startDate"
                  value={
                    formData.startDate ? new Date(formData.startDate) : undefined
                  }
                  onSelectDate={(date?: Date | null): void =>
                    handleDateChange("startDate", date)
                  }
                  minDate={new Date(getMinDate())}
                  firstDayOfWeek={DayOfWeek.Monday}
                  formatDate={(date?: Date): string =>
                    date ? formatDateISO(date) : ""
                  }
                  placeholder="Select start date"
                  className={`datePickerControl ${
                    getFieldError("startDate") ? "error" : ""
                  }`}
                />
                {getFieldError("startDate") && (
                  <span className="errorMessage">
                    {getFieldError("startDate")}
                  </span>
                )}
              </div>

              <div className="formGroup">
                <label className="label" htmlFor="endDate">
                  End Date <span className="required">*</span>
                </label>
                <DatePicker
                  id="endDate"
                  value={
                    formData.endDate ? new Date(formData.endDate) : undefined
                  }
                  onSelectDate={(date?: Date | null): void =>
                    handleDateChange("endDate", date)
                  }
                  minDate={new Date(formData.startDate || getMinDate())}
                  firstDayOfWeek={DayOfWeek.Monday}
                  formatDate={(date?: Date): string =>
                    date ? formatDateISO(date) : ""
                  }
                  placeholder="Select end date"
                  className={`datePickerControl ${
                    getFieldError("endDate") ? "error" : ""
                  }`}
                />
                {getFieldError("endDate") && (
                  <span className="errorMessage">
                    {getFieldError("endDate")}
                  </span>
                )}
              </div>
            </div>

            {/* Days Info */}
            {daysCount > 0 && (
              <div className="infoBox">
                <div className="infoBadge">
                  <span className="infoLabel">Business Days:</span>
                  <span className="infoBadgeValue">{daysCount}</span>
                </div>
                <div className="infoBadge">
                  <span className="infoLabel">Excluded:</span>
                  <span className="infoBadgeValue">{excludedDays}</span>
                </div>
                {selectedLeaveType && (
                  <div className="infoBadge">
                    <span className="infoLabel">Available:</span>
                    <span
                      className={`infoBadgeValue ${
                        availableDays < daysCount ? "warning" : "success"
                      }`}
                    >
                      {availableDays}
                    </span>
                  </div>
                )}
              </div>
            )}

            {holidaysInRange.length > 0 && (
              <div className="holidayInfo">
                <span className="holidayInfoTitle">Company holidays excluded</span>
                <div className="holidayChips">
                  {holidaysInRange.map((holiday) => (
                    <span key={holiday.date} className="holidayChip">
                      {holiday.name} ({holiday.date})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reason Field */}
            <div className="formGroup">
              <label className="label" htmlFor="reason">
                Reason <span className="required">*</span>
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Please provide a reason for your leave request..."
                rows={4}
                className={`textarea ${getFieldError("reason") ? "error" : ""}`}
              />
              {getFieldError("reason") && (
                <span className="errorMessage">{getFieldError("reason")}</span>
              )}
            </div>

            {/* Leave Balance Info */}
            <div className="balanceCard">
              <h3 className="balanceTitle">Leave Balance</h3>
              <div className="balanceItems">
                {LEAVE_TYPES.map((leave) => {
                  const balance = leaveBalance[leave.value] || {
                    used: 0,
                    total: leave.daysAllowed,
                  };
                  const available = leave.daysAllowed - balance.used;
                  const percentage = (available / leave.daysAllowed) * 100;

                  return (
                    <div key={leave.value} className="balanceItem">
                      <div className="balanceItemHeader">
                        <span className="balanceItemLabel">{leave.label}</span>
                        <span className="balanceItemCount">
                          {available}/{leave.daysAllowed}
                        </span>
                      </div>
                      <div className="progressBar">
                        <div
                          className="progressFill"
                          style={{
                            width: `${Math.max(0, percentage)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="formButtons">
              <button
                type="button"
                className="btnCancel"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btnSubmit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default ApplyLeave;
