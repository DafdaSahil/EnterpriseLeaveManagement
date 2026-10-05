import * as React from "react";
import { DatePicker, DayOfWeek } from "@fluentui/react";
import MainLayout from "../../layout/MainLayout";
import { AuthContext } from "../../context/AuthContext";
import {
  deleteLeave,
  getEmployees,
  getLeaves,
  getLeavesByManager,
  updateLeave,
} from "../../services/SPService";
import { LEAVE_TYPES, STATUS_COLORS, MESSAGES } from "../../utils/constants";
import { findOverlappingLeaves, formatDate, formatDateISO, getDateRange } from "../../utils/dateUtils";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import "./leave-list.css";
import { ILeave } from "../../interfaces/ILeave";
import { IEmployee } from "../../interfaces/IEmployee";

import { pdf } from "@react-pdf/renderer";
import { LeavePdfDocument } from "./LeavePdfDocument";

type TStatus = "Pending" | "Approved" | "Rejected";
type TViewMode = "cards" | "table";
type TSortKey = "AppliedDate" | "StartDate" | "EmployeeEmail" | "Status";

const LeaveList = (): JSX.Element => {
  const { user } = React.useContext(AuthContext);
  const [leaves, setLeaves] = React.useState<ILeave[]>([]);
  const [employees, setEmployees] = React.useState<IEmployee[]>([]);
  const [filteredLeaves, setFilteredLeaves] = React.useState<ILeave[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState("Pending");
  const [employeeFilter, setEmployeeFilter] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = React.useState("");
  const [fromDateFilter, setFromDateFilter] = React.useState("");
  const [toDateFilter, setToDateFilter] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewMode, setViewMode] = React.useState<TViewMode>("cards");
  const [sortKey, setSortKey] = React.useState<TSortKey>("AppliedDate");
  const [actioningId, setActioningId] = React.useState<number | null>(null);
  const [selectedLeave, setSelectedLeave] = React.useState<ILeave | null>(null);
  const isManager = user?.Role === "Manager" || user?.Role === "Admin";

  const fetchLeaves = async (): Promise<void> => {
    setLoading(true);
    try {
      const data =
        user?.Role === "Manager"
          ? await getLeavesByManager(user.Email)
          : await getLeaves();
      setLeaves(data);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      await Swal.fire({
        title: "Error",
        text: MESSAGES.ERROR_FETCHING,
        icon: "error",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaves on mount
  React.useEffect((): void => {
    fetchLeaves().catch((error) => {
      console.error("Error loading leaves:", error);
    });
  }, []);

  React.useEffect((): void => {
    if (!isManager) {
      return;
    }

    getEmployees()
      .then((data) => setEmployees(data))
      .catch((error) => {
        console.error("Error loading employees for filters:", error);
      });
  }, [isManager]);

  const employeeDepartmentMap = React.useMemo((): Record<string, string> => {
    return employees.reduce(
      (map, employee) => {
        map[employee.Email] = employee.Department || "";
        return map;
      },
      {} as Record<string, string>,
    );
  }, [employees]);

  const departments = React.useMemo((): string[] => {
    const uniqueDepartments = new Set(
      employees
        .map((employee) => employee.Department || "")
        .filter((department) => department.length > 0),
    );

    return Array.from(uniqueDepartments).sort();
  }, [employees]);

  const getEmployeeName = React.useCallback(
    (email: string): string => {
      const employee = employees.find((item) => item.Email === email);
      return employee?.Title || employee?.Name || email;
    },
    [employees],
  );

  const getLeaveTime = (
    leave: ILeave,
    fieldName: TSortKey,
  ): number | string => {
    if (fieldName === "StartDate") {
      return new Date(leave.StartDate).getTime();
    }

    if (fieldName === "AppliedDate") {
      return leave.AppliedDate ? new Date(leave.AppliedDate).getTime() : 0;
    }

    return leave[fieldName] || "";
  };

  // Filter leaves based on status and user role
  React.useEffect((): void => {
    let filtered = leaves;

    if (statusFilter) {
      filtered = filtered.filter((l) => l.Status === statusFilter);
    }

    if (user?.Role === "Employee") {
      filtered = filtered.filter((l) => l.EmployeeEmail === user.Email);
    }

    if (isManager && employeeFilter) {
      filtered = filtered.filter((l) => l.EmployeeEmail === employeeFilter);
    }

    if (isManager && departmentFilter) {
      filtered = filtered.filter(
        (l) => employeeDepartmentMap[l.EmployeeEmail] === departmentFilter,
      );
    }

    if (isManager && leaveTypeFilter) {
      filtered = filtered.filter((l) => l.LeaveType === leaveTypeFilter);
    }

    if (isManager && fromDateFilter) {
      const fromDate = new Date(fromDateFilter);
      filtered = filtered.filter((l) => new Date(l.EndDate) >= fromDate);
    }

    if (isManager && toDateFilter) {
      const toDate = new Date(toDateFilter);
      filtered = filtered.filter((l) => new Date(l.StartDate) <= toDate);
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    if (normalizedSearchTerm) {
      filtered = filtered.filter((leave) => {
        const employeeName = getEmployeeName(leave.EmployeeEmail).toLowerCase();
        return (
          employeeName.indexOf(normalizedSearchTerm) >= 0 ||
          leave.EmployeeEmail.toLowerCase().indexOf(normalizedSearchTerm) >=
            0 ||
          leave.LeaveType.toLowerCase().indexOf(normalizedSearchTerm) >= 0 ||
          leave.Reason.toLowerCase().indexOf(normalizedSearchTerm) >= 0
        );
      });
    }

    filtered = [...filtered].sort((a, b) => {
      const firstValue = getLeaveTime(a, sortKey);
      const secondValue = getLeaveTime(b, sortKey);

      if (typeof firstValue === "number" && typeof secondValue === "number") {
        return secondValue - firstValue;
      }

      return String(firstValue).localeCompare(String(secondValue));
    });

    setFilteredLeaves(filtered);
  }, [
    departmentFilter,
    employeeDepartmentMap,
    employeeFilter,
    fromDateFilter,
    getEmployeeName,
    isManager,
    leaveTypeFilter,
    leaves,
    searchTerm,
    sortKey,
    statusFilter,
    toDateFilter,
    user,
  ]);

  const exportFilteredLeaves = (): void => {
    const headers = [
      "Employee",
      "Email",
      "Department",
      "Leave Type",
      "Start Date",
      "End Date",
      "Status",
      "Reason",
      "Approver Note",
    ];
    const rows = filteredLeaves.map((leave) => [
      getEmployeeName(leave.EmployeeEmail),
      leave.EmployeeEmail,
      employeeDepartmentMap[leave.EmployeeEmail] || "",
      leave.LeaveType,
      formatDate(leave.StartDate),
      formatDate(leave.EndDate),
      leave.Status,
      leave.Reason,
      leave.ApproverComments || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leave-requests-${formatDateISO(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: TStatus): string => {
    return STATUS_COLORS[status] || "#64748b";
  };

  const getPdfRgb = (hexColor: string): [number, number, number] => {
    const hex = hexColor.replace("#", "");
    const fallback: [number, number, number] = [100, 116, 139];

    if (hex.length !== 6) {
      return fallback;
    }

    return [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
    ];
  };

  // PDF generation using jsPDF
  const exportFilteredLeavesPdf = (): void => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const cardWidth = pageWidth - margin * 2;

    let yPosition = 16;
    let cardsOnPage = 0;

    const setRGB = (color: [number, number, number]): void => {
      doc.setTextColor(color[0], color[1], color[2]);
    };

    const addPage = (): void => {
      if (cardsOnPage > 0) {
        doc.addPage();
      }
      yPosition = 14;
      cardsOnPage = 0;

      // Page header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      setRGB([15, 23, 42]);
      const title = isManager ? "Leave Requests" : "My Leave History";
      doc.text(title, margin, yPosition);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setRGB([100, 116, 139]);
      doc.text(
        `Generated: ${formatDate(new Date())} | Total: ${filteredLeaves.length}`,
        margin,
        yPosition + 4,
      );

      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition + 6, pageWidth - margin, yPosition + 6);

      yPosition += 9;
    };

    const drawCard = (leave: ILeave): void => {
      const employeeName = getEmployeeName(leave.EmployeeEmail);
      const department = employeeDepartmentMap[leave.EmployeeEmail] || "-";

      const reasonLines = doc.splitTextToSize(
        leave.Reason || "-",
        cardWidth - 16,
      );

      const cardHeight = 42 + reasonLines.length * 4;

      // Check if card fits on current page
      if (yPosition + cardHeight > pageHeight - margin) {
        addPage();
      }

      const cardTop = yPosition;
      const statusColor = getPdfRgb(getStatusColor(leave.Status as TStatus));

      // Card background with rounded corners (using multiple rectangles)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(219, 228, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, cardTop, cardWidth, cardHeight, 1.5, 1.5, "FD");

      // // Status color accent bar at left with rounded top
      // doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      // doc.roundedRect(margin, cardTop, 3, cardHeight, 1.5, 0, "F");

      // Employee name (bold, dark)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setRGB([15, 23, 42]);
      doc.text(employeeName, margin + 5, cardTop + 6);

      // Status badge with gradient-like effect (darker background)
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      const statusText = leave.Status;
      const badgeWidth = doc.getStringUnitWidth(statusText) * 2.5 + 3;
      doc.roundedRect(
        pageWidth - margin - badgeWidth - 2,
        cardTop + 2.5,
        badgeWidth,
        5,
        1,
        1,
        "F",
      );
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setRGB([255, 255, 255]);
      const badgeX = pageWidth - margin - badgeWidth - 2;

      doc.text(statusText, badgeX + badgeWidth / 2, cardTop + 6, {
        align: "center",
      });

      // Email (small, gray)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      setRGB([100, 116, 139]);
      doc.text(leave.EmployeeEmail, margin + 5, cardTop + 9);

      doc.setDrawColor(235, 235, 235);

      doc.line(margin + 5, cardTop + 12, pageWidth - margin - 5, cardTop + 12);

      const detailsY = cardTop + 17;

      doc.setFontSize(6);
      setRGB([100, 116, 139]);

      doc.text("Leave Type", margin + 6, detailsY);
      doc.text("Duration", margin + 6, detailsY + 5);
      doc.text("Department", margin + 6, detailsY + 10);

      doc.setFontSize(7.5);
      setRGB([15, 23, 42]);

      doc.text(leave.LeaveType, margin + 35, detailsY);

      doc.text(
        getDateRange(leave.StartDate, leave.EndDate),
        margin + 35,
        detailsY + 5,
      );

      doc.text(department, margin + 35, detailsY + 10);

      const reasonY = detailsY + 18;

      doc.setFontSize(6);
      setRGB([100, 116, 139]);

      doc.text("Reason", margin + 6, reasonY);

      doc.setFontSize(7);
      setRGB([71, 85, 105]);

      doc.text(reasonLines, margin + 6, reasonY + 4);

      yPosition = cardTop + cardHeight + 4;
      cardsOnPage++;
    };

    addPage();
    filteredLeaves.forEach(drawCard);

    doc.save(`leave-requests-${formatDateISO(new Date())}.pdf`);
  };

  // React component for PDF generation using @react-pdf/renderer
  const exportReactPdf = async (): Promise<void> => {
    const blob = await pdf(
      <LeavePdfDocument
        leaves={filteredLeaves}
        getEmployeeName={getEmployeeName}
        employeeDepartmentMap={employeeDepartmentMap}
      />,
    ).toBlob();

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `leave-react-pdf-${formatDateISO(new Date())}.pdf`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleApprove = async (leaveId: number): Promise<void> => {
    const { value: comment } = await Swal.fire({
      title: "Approve Leave?",
      input: "textarea",
      inputPlaceholder:
        "Add optional comment (e.g., approved, coverage arranged, etc.)",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#64748b",
      heightAuto: false,
    });

    if (comment !== undefined) {
      setActioningId(leaveId);
      try {
        await updateLeave(leaveId, "Approved", comment);
        await Swal.fire({
          title: "Success!",
          text: MESSAGES.LEAVE_APPROVED,
          icon: "success",
          confirmButtonColor: "#2563eb",
          heightAuto: false,
        });
        await fetchLeaves();
      } catch (error) {
        console.error("Error approving leave:", error);
        await Swal.fire({
          title: "Error",
          text: MESSAGES.ERROR,
          icon: "error",
          confirmButtonColor: "#2563eb",
          heightAuto: false,
        });
      } finally {
        setActioningId(null);
      }
    }
  };

  const handleReject = async (leaveId: number): Promise<void> => {
    // inputValidator keeps the dialog open and explains why, instead of the
    // previous behaviour of firing a second prompt with no handlers attached,
    // which silently did nothing when the reason was left blank.
    const { value: comment } = await Swal.fire({
      title: "Reject Leave?",
      input: "textarea",
      inputPlaceholder: "Please provide reason for rejection",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reject",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      inputValidator: (value: string): string | void => {
        if (!value || !value.trim()) {
          return "A reason is required so the employee knows why.";
        }

        if (value.trim().length < 5) {
          return "Please give a little more detail (at least 5 characters).";
        }

        return undefined;
      },
    });

    // Dismissed with no value.
    if (!comment) {
      return;
    }

    setActioningId(leaveId);
    try {
      await updateLeave(leaveId, "Rejected", comment.trim());
      await Swal.fire({
        title: "Success!",
        text: MESSAGES.LEAVE_REJECTED,
        icon: "success",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
      await fetchLeaves();
    } catch (error) {
      console.error("Error rejecting leave:", error);
      await Swal.fire({
        title: "Error",
        text: MESSAGES.ERROR,
        icon: "error",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } finally {
      setActioningId(null);
    }
  };

  const canCancelLeave = (leave: ILeave): boolean => {
    if (user?.Role !== "Employee" || leave.EmployeeEmail !== user.Email) {
      return false;
    }

    if (leave.Status === "Pending") {
      return true;
    }

    if (leave.Status !== "Approved") {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(leave.StartDate);
    startDate.setHours(0, 0, 0, 0);
    return startDate > today;
  };

  const handleCancelLeave = async (leave: ILeave): Promise<void> => {
    if (!leave.Id) {
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: "Cancel Leave?",
      text:
        leave.Status === "Approved"
          ? "This approved leave starts in the future and will be removed."
          : "This pending leave request will be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Cancel Leave",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      heightAuto: false,
    });

    if (!isConfirmed) {
      return;
    }

    setActioningId(leave.Id);

    try {
      await deleteLeave(leave.Id);
      await Swal.fire({
        title: "Cancelled!",
        text: MESSAGES.LEAVE_CANCELLED,
        icon: "success",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
      await fetchLeaves();
    } catch (error) {
      console.error("Error cancelling leave:", error);
      await Swal.fire({
        title: "Error",
        text: MESSAGES.ERROR_CANCELLING,
        icon: "error",
        confirmButtonColor: "#2563eb",
        heightAuto: false,
      });
    } finally {
      setActioningId(null);
    }
  };

  const getApproverNote = (leave: ILeave): string => {
    if (leave.Status === "Pending") {
      return "No approval note has been added yet.";
    }

    return leave.ApproverComments?.trim() || "No additional note provided.";
  };

  const getStatusLabel = (leave: ILeave): string => {
    if (leave.Status === "Pending") {
      return "Awaiting review";
    }

    return leave.Status === "Approved" ? "Approved" : "Rejected";
  };

  // Check if a leave overlaps with any other employee's leave
  const getOverlapInfo = (leave: ILeave): { hasOverlap: boolean; overlappingWith: ILeave[] } => {
    const overlapping = findOverlappingLeaves(
      leaves,
      leave.StartDate,
      leave.EndDate,
      {
        excludeId: leave.Id,
        statuses: ["Pending", "Approved"],
      },
    ).filter((l) => l.EmployeeEmail !== leave.EmployeeEmail) as ILeave[];

    return {
      hasOverlap: overlapping.length > 0,
      overlappingWith: overlapping,
    };
  };

  return (
    <MainLayout>
      <div className="leaveListContainer">
        {/* Page Header */}
        <div className="pageHeader">
          <div>
            <h1 className="pageTitle">
              {isManager ? "Leave Requests" : "My Leave History"}
            </h1>
            <p className="pageSubtitle">
              {isManager
                ? "Review, filter, export, and manage leave requests"
                : "Track your applications, approvals, notes, and cancellations"}
            </p>
          </div>
          <div className="pageActions">
            <button
              className={`viewToggleBtn ${viewMode === "cards" ? "active" : ""}`}
              type="button"
              onClick={() => setViewMode("cards")}
              aria-label="Card view"
              title="Card view"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button
              className={`viewToggleBtn ${viewMode === "table" ? "active" : ""}`}
              type="button"
              onClick={() => setViewMode("table")}
              aria-label="Table view"
              title="Table view"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="3" y1="16" x2="21" y2="16" />
                <line x1="9" y1="4" x2="9" y2="20" />
                <line x1="15" y1="4" x2="15" y2="20" />
              </svg>
            </button>
            <button
              className="exportBtn"
              type="button"
              onClick={exportFilteredLeaves}
              disabled={filteredLeaves.length === 0}
            >
              Export CSV
            </button>
            <button
              className="exportBtn"
              type="button"
              onClick={exportFilteredLeavesPdf}
              disabled={filteredLeaves.length === 0}
            >
              Export PDF
            </button>
            <button
              className="exportBtn"
              type="button"
              onClick={() => {
                exportReactPdf().catch(console.error);
              }}
              disabled={filteredLeaves.length === 0}
            >
              Export React PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filterBar">
          <div className="searchBox">
            <input
              className="searchInput"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search employee, type, or reason..."
            />
          </div>
          <div className="filterGroup">
            {/* <label className="filterLabel">Filter by Status:</label> */}
            <div className="filterButtons">
              {["", "Pending", "Approved", "Rejected"].map((status) => (
                <button
                  key={status || "All"}
                  className={`filterBtn ${
                    statusFilter === status ? "active" : ""
                  }`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status || "All"}
                </button>
              ))}
            </div>
          </div>
          <div className="sortGroup">
            <label className="filterLabel" htmlFor="sortKey">
              Sort
            </label>
            <select
              id="sortKey"
              className="filterSelect compact"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as TSortKey)}
            >
              <option value="AppliedDate">Applied Date</option>
              <option value="StartDate">Start Date</option>
              <option value="EmployeeEmail">Employee</option>
              <option value="Status">Status</option>
            </select>
          </div>
          <button
            className="refreshBtn"
            onClick={() => {
              fetchLeaves().catch((error) => {
                console.error("Error refreshing leaves:", error);
              });
            }}
            disabled={loading}
            title="Refresh leave list"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {isManager && (
          <div className="advancedFilterBar">
            <div className="filterField">
              <label className="filterLabel" htmlFor="employeeFilter">
                Employee
              </label>
              <select
                id="employeeFilter"
                className="filterSelect"
                value={employeeFilter}
                onChange={(event) => setEmployeeFilter(event.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee.Email} value={employee.Email}>
                    {employee.Title || employee.Name || employee.Email}
                  </option>
                ))}
              </select>
            </div>

            <div className="filterField">
              <label className="filterLabel" htmlFor="departmentFilter">
                Department
              </label>
              <select
                id="departmentFilter"
                className="filterSelect"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div className="filterField">
              <label className="filterLabel" htmlFor="leaveTypeFilter">
                Leave Type
              </label>
              <select
                id="leaveTypeFilter"
                className="filterSelect"
                value={leaveTypeFilter}
                onChange={(event) => setLeaveTypeFilter(event.target.value)}
              >
                <option value="">All Types</option>
                {LEAVE_TYPES.map((leaveType) => (
                  <option key={leaveType.value} value={leaveType.value}>
                    {leaveType.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filterField">
              <label className="filterLabel" htmlFor="fromDateFilter">
                From
              </label>
              <DatePicker
                id="fromDateFilter"
                value={fromDateFilter ? new Date(fromDateFilter) : undefined}
                onSelectDate={(date?: Date | null): void => {
                  const nextFromDate = date ? formatDateISO(date) : "";
                  setFromDateFilter(nextFromDate);

                  if (
                    nextFromDate &&
                    toDateFilter &&
                    new Date(toDateFilter) < new Date(nextFromDate)
                  ) {
                    setToDateFilter("");
                  }
                }}
                firstDayOfWeek={DayOfWeek.Monday}
                formatDate={(date?: Date): string =>
                  date ? formatDateISO(date) : ""
                }
                placeholder="Start date"
                className="filterDatePicker"
              />
            </div>

            <div className="filterField">
              <label className="filterLabel" htmlFor="toDateFilter">
                To
              </label>
              <DatePicker
                id="toDateFilter"
                value={toDateFilter ? new Date(toDateFilter) : undefined}
                onSelectDate={(date?: Date | null): void =>
                  setToDateFilter(date ? formatDateISO(date) : "")
                }
                minDate={fromDateFilter ? new Date(fromDateFilter) : undefined}
                firstDayOfWeek={DayOfWeek.Monday}
                formatDate={(date?: Date): string =>
                  date ? formatDateISO(date) : ""
                }
                placeholder="End date"
                className="filterDatePicker"
              />
            </div>

            <button
              className="clearFiltersBtn"
              type="button"
              onClick={() => {
                setEmployeeFilter("");
                setDepartmentFilter("");
                setLeaveTypeFilter("");
                setFromDateFilter("");
                setToDateFilter("");
              }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Leaves List */}
        {filteredLeaves.length > 0 ? (
          viewMode === "cards" ? (
            <div className="leavesList">
              {filteredLeaves.map((leave) => (
                <div key={leave.Id} className="leaveCard">
                  <div className="leaveCardTop">
                    <div className="leaveInfo">
                      <div className="leaveName">{leave.EmployeeEmail}</div>
                      <div className="leaveDetails">
                        <span className="leaveType">{leave.LeaveType}</span>
                        {leave.HalfDayType && leave.HalfDayType !== "None" && (
                          <span className="halfDayBadge">
                            {leave.HalfDayType === "FirstHalf" ? "AM" : "PM"}
                          </span>
                        )}
                        <span className="separator">•</span>
                        <span className="leaveDates">
                          {getDateRange(leave.StartDate, leave.EndDate)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="statusBadge"
                      style={{
                        backgroundColor: getStatusColor(
                          leave.Status as TStatus,
                        ),
                        color: "#ffffff",
                      }}
                    >
                      {leave.Status}
                    </div>
                  </div>

                  {leave.Reason && (
                    <div className="leaveReason">
                      <strong>Reason:</strong> {leave.Reason}
                    </div>
                  )}

                  {(() => {
                    const overlapInfo = getOverlapInfo(leave);
                    if (!overlapInfo.hasOverlap) return null;
                    return (
                      <div className="overlapWarning">
                        <div className="overlapWarningHeader">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <span>Overlapping with {overlapInfo.overlappingWith.length} other leave(s)</span>
                        </div>
                        <div className="overlapWarningList">
                          {overlapInfo.overlappingWith.map((ol) => (
                            <div key={ol.Id} className="overlapWarningItem">
                              <span className="overlapWarningEmployee">{getEmployeeName(ol.EmployeeEmail)}</span>
                              <span className="overlapWarningDates">
                                {ol.LeaveType} ({ol.Status}): {formatDate(ol.StartDate)} - {formatDate(ol.EndDate)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="actionButtons">
                    <button
                      className="btnView"
                      onClick={() => setSelectedLeave(leave)}
                      type="button"
                      aria-label="View"
                      title="View"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>

                    {isManager && leave.Status === "Pending" && (
                      <React.Fragment>
                        <button
                          className="btnApprove"
                          onClick={() => {
                            handleApprove(leave.Id!).catch((error) => {
                              console.error("Error approving leave:", error);
                            });
                          }}
                          disabled={actioningId !== null}
                          type="button"
                          aria-label="Approve"
                          title="Approve"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <button
                          className="btnReject"
                          onClick={() => {
                            handleReject(leave.Id!).catch((error) => {
                              console.error("Error rejecting leave:", error);
                            });
                          }}
                          disabled={actioningId !== null}
                          type="button"
                          aria-label="Reject"
                          title="Reject"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </React.Fragment>
                    )}

                    {canCancelLeave(leave) && (
                      <button
                        className="btnCancelLeave"
                        onClick={() => {
                          handleCancelLeave(leave).catch((error) => {
                            console.error("Error cancelling leave:", error);
                          });
                        }}
                        disabled={actioningId !== null}
                        type="button"
                        aria-label="Cancel"
                        title="Cancel"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {leave.ApprovedDate && (
                    <div className="approvalInfo">
                      Approved on {formatDate(leave.ApprovedDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="leaveTableWrap">
              <table className="leaveTable">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.Id}>
                      <td>
                        <div className="tableEmployeeName">
                          {getEmployeeName(leave.EmployeeEmail)}
                        </div>
                        <div className="tableEmployeeEmail">
                          {leave.EmployeeEmail}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{leave.LeaveType}</span>
                          {leave.HalfDayType && leave.HalfDayType !== "None" && (
                            <span className="halfDayBadge">
                              {leave.HalfDayType === "FirstHalf" ? "AM" : "PM"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="tableDateCell">
                          <span>{getDateRange(leave.StartDate, leave.EndDate)}</span>
                          {(() => {
                            const overlapInfo = getOverlapInfo(leave);
                            if (!overlapInfo.hasOverlap) return null;
                            return (
                              <span className="tableOverlapBadge" title={`Overlaps with: ${overlapInfo.overlappingWith.map((ol) => `${getEmployeeName(ol.EmployeeEmail)} (${ol.LeaveType} ${ol.Status}: ${formatDate(ol.StartDate)} - ${formatDate(ol.EndDate)})`).join('; ')}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                  <line x1="12" y1="9" x2="12" y2="13" />
                                  <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                Overlap
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="tableReason">{leave.Reason || "-"}</td>
                      <td>
                        <div className="tableActions">
                          <button
                            className="tableActionBtn"
                            type="button"
                            onClick={() => setSelectedLeave(leave)}
                            aria-label="View"
                            title="View"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          {isManager && leave.Status === "Pending" && (
                            <React.Fragment>
                              <button
                                className="tableActionBtn approve"
                                type="button"
                                disabled={actioningId !== null}
                                onClick={() => {
                                  handleApprove(leave.Id!).catch((error) => {
                                    console.error(
                                      "Error approving leave:",
                                      error,
                                    );
                                  });
                                }}
                                aria-label="Approve"
                                title="Approve"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </button>
                              <button
                                className="tableActionBtn reject"
                                type="button"
                                disabled={actioningId !== null}
                                onClick={() => {
                                  handleReject(leave.Id!).catch((error) => {
                                    console.error(
                                      "Error rejecting leave:",
                                      error,
                                    );
                                  });
                                }}
                                aria-label="Reject"
                                title="Reject"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </React.Fragment>
                          )}
                          {canCancelLeave(leave) && (
                            <button
                              className="tableActionBtn cancel"
                              type="button"
                              disabled={actioningId !== null}
                              onClick={() => {
                                handleCancelLeave(leave).catch((error) => {
                                  console.error(
                                    "Error cancelling leave:",
                                    error,
                                  );
                                });
                              }}
                              aria-label="Cancel"
                              title="Cancel"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="emptyState">
            <div className="emptyIcon">📋</div>
            <h3 className="emptyTitle">
              {statusFilter === "Pending"
                ? "No pending leave requests"
                : `No ${statusFilter.toLowerCase()} leaves`}
            </h3>
            <p className="emptyText">
              {isManager
                ? "All leave requests have been processed"
                : "You haven't applied for any leaves"}
            </p>
          </div>
        )}

        {selectedLeave && (
          <div
            className="leaveModalOverlay"
            onClick={() => setSelectedLeave(null)}
            role="presentation"
          >
            <div
              className="leaveDetailModal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="leave-detail-title"
            >
              <div className="leaveModalHeader">
                <div>
                  <h2 id="leave-detail-title" className="leaveModalTitle">
                    Leave Details
                  </h2>
                  <p className="leaveModalSubtitle">
                    {selectedLeave.LeaveType} request
                  </p>
                </div>
                <button
                  className="leaveModalClose"
                  onClick={() => setSelectedLeave(null)}
                  aria-label="Close leave details"
                  type="button"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="leaveTimeline">
                <div className="timelineStep done">
                  <span className="timelineDot" />
                  <div>
                    <span className="timelineTitle">Applied</span>
                    <span className="timelineMeta">
                      {selectedLeave.AppliedDate
                        ? formatDate(selectedLeave.AppliedDate)
                        : "Submitted"}
                    </span>
                  </div>
                </div>
                <div
                  className={`timelineStep ${
                    selectedLeave.Status !== "Pending" ? "done" : "active"
                  }`}
                >
                  <span className="timelineDot" />
                  <div>
                    <span className="timelineTitle">Review</span>
                    <span className="timelineMeta">
                      {selectedLeave.Status === "Pending"
                        ? "Awaiting manager action"
                        : "Completed"}
                    </span>
                  </div>
                </div>
                <div
                  className={`timelineStep ${
                    selectedLeave.Status !== "Pending" ? "done" : ""
                  }`}
                >
                  <span className="timelineDot" />
                  <div>
                    <span className="timelineTitle">
                      {getStatusLabel(selectedLeave)}
                    </span>
                    <span className="timelineMeta">
                      {selectedLeave.ApprovedDate
                        ? formatDate(selectedLeave.ApprovedDate)
                        : "Not processed yet"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="leaveDetailGrid">
                <div className="detailItem">
                  <span className="detailLabel">Employee</span>
                  <span className="detailValue">
                    {selectedLeave.EmployeeEmail}
                  </span>
                </div>
                <div className="detailItem">
                  <span className="detailLabel">Status</span>
                  <span
                    className="detailStatus"
                    style={{
                      backgroundColor: getStatusColor(
                        selectedLeave.Status as TStatus,
                      ),
                    }}
                  >
                    {selectedLeave.Status}
                  </span>
                </div>
                <div className="detailItem">
                  <span className="detailLabel">Leave Type</span>
                  <span className="detailValue">
                    {selectedLeave.LeaveType}
                    {selectedLeave.HalfDayType && selectedLeave.HalfDayType !== "None" && (
                      <span className="halfDayBadge" style={{ marginLeft: "6px" }}>
                        {selectedLeave.HalfDayType === "FirstHalf" ? "AM" : "PM"}
                      </span>
                    )}
                  </span>
                </div>
                <div className="detailItem">
                  <span className="detailLabel">Date Range</span>
                  <span className="detailValue">
                    {getDateRange(
                      selectedLeave.StartDate,
                      selectedLeave.EndDate,
                    )}
                    {selectedLeave.HalfDayType && selectedLeave.HalfDayType !== "None" && (
                      <span className="halfDayBadge" style={{ marginLeft: "6px" }}>
                        {selectedLeave.HalfDayType === "FirstHalf" ? "AM" : "PM"}
                      </span>
                    )}
                  </span>
                </div>
                <div className="detailItem">
                  <span className="detailLabel">Applied On</span>
                  <span className="detailValue">
                    {selectedLeave.AppliedDate
                      ? formatDate(selectedLeave.AppliedDate)
                      : "-"}
                  </span>
                </div>
                <div className="detailItem">
                  <span className="detailLabel">Processed On</span>
                  <span className="detailValue">
                    {selectedLeave.ApprovedDate
                      ? formatDate(selectedLeave.ApprovedDate)
                      : "-"}
                  </span>
                </div>
              </div>

              {(() => {
                const overlapInfo = getOverlapInfo(selectedLeave);
                if (!overlapInfo.hasOverlap) return null;
                return (
                  <div className="detailSection">
                    <span className="detailLabel">Leave Overlap</span>
                    <div className="overlapWarning" style={{ marginTop: "8px" }}>
                      <div className="overlapWarningHeader">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>Overlapping with {overlapInfo.overlappingWith.length} other leave(s)</span>
                      </div>
                      <div className="overlapWarningList">
                        {overlapInfo.overlappingWith.map((ol) => (
                          <div key={ol.Id} className="overlapWarningItem">
                            <span className="overlapWarningEmployee">{getEmployeeName(ol.EmployeeEmail)}</span>
                            <span className="overlapWarningDates">
                              {ol.LeaveType} ({ol.Status}): {formatDate(ol.StartDate)} - {formatDate(ol.EndDate)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="detailSection">
                <span className="detailLabel">Employee Reason</span>
                <p className="detailNote">{selectedLeave.Reason || "-"}</p>
              </div>

              <div className="detailSection">
                <span className="detailLabel">Approver Note</span>
                <p className="detailNote">{getApproverNote(selectedLeave)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LeaveList;
