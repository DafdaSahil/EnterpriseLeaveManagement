import * as React from "react";
import MainLayout from "../../layout/MainLayout";
import { AuthContext } from "../../context/AuthContext";
import { deleteLeave, getLeavesByEmployee } from "../../services/SPService";
import { HolidaysContext } from "../../context/HolidaysContext";
import { ILeave } from "../../interfaces/ILeave";
import { LEAVE_TYPES, MESSAGES, STATUS_COLORS } from "../../utils/constants";
import {
  calculateFractionalDays,
  findOverlappingLeaves,
  formatDate,
  formatDateISO,
  getDateRange,
} from "../../utils/dateUtils";
import Swal from "sweetalert2";
import "./my-leave-history.css";

type TStatus = "Pending" | "Approved" | "Rejected";
type TSortKey = "AppliedDate" | "StartDate" | "LeaveType" | "Status";

const PAGE_SIZE = 8;

// -- Icons ---------------------------------------------------------------
const CalendarIcon = (): JSX.Element => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CheckIcon = (): JSX.Element => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClockIcon = (): JSX.Element => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const XIcon = (): JSX.Element => (
  <svg
    width="18"
    height="18"
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
);

const EyeIcon = (): JSX.Element => (
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
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const TrashIcon = (): JSX.Element => (
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// -- Helpers --
const formatNumber = (value: number): string =>
  value % 1 !== 0 ? value.toFixed(1) : String(value);

const getLeaveDays = (leave: ILeave, holidayDates?: string[]): number =>
  calculateFractionalDays(
    leave.StartDate,
    leave.EndDate,
    leave.HalfDayType || "None",
    holidayDates,
  );

const getDurationLabel = (leave: ILeave, holidayDates?: string[]): string => {
  const days = getLeaveDays(leave, holidayDates);
  return `${formatNumber(days)} ${days === 1 ? "day" : "days"}`;
};

const getHalfDayLabel = (halfDayType?: string): string => {
  if (halfDayType === "FirstHalf") {
    return "AM";
  }

  if (halfDayType === "SecondHalf") {
    return "PM";
  }

  return "";
};

const canCancelLeave = (leave: ILeave): boolean => {
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

// -- Page --
const MyLeaveHistory = (): JSX.Element => {
  const { user } = React.useContext(AuthContext);
  const { holidayDates } = React.useContext(HolidaysContext);

  const [leaves, setLeaves] = React.useState<ILeave[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [leaveTypeFilter, setLeaveTypeFilter] = React.useState<string>("");
  const [yearFilter, setYearFilter] = React.useState<string>("");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [sortKey, setSortKey] = React.useState<TSortKey>("StartDate");
  const [page, setPage] = React.useState<number>(1);
  const [actioningId, setActioningId] = React.useState<number | null>(null);
  const [selectedLeave, setSelectedLeave] = React.useState<ILeave | null>(
    null,
  );

  const email = user?.Email;

  // ? Fetch data ?
  const fetchLeaves = React.useCallback(async (): Promise<void> => {
    if (!email) {
      setLeaves([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await getLeavesByEmployee(email);
      setLeaves(data);
    } catch (error) {
      console.error("Error fetching leave history:", error);
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
  }, [email]);

  React.useEffect((): void => {
    fetchLeaves().catch((error) => {
      console.error("Error loading leave history:", error);
    });
  }, [fetchLeaves]);

  // ? Stats ?
  const stats = React.useMemo((): {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    daysTaken: number;
  } => {
    return leaves.reduce(
      (accumulator, leave) => {
        accumulator.total += 1;

        if (leave.Status === "Approved") {
          accumulator.approved += 1;
          accumulator.daysTaken += getLeaveDays(leave, holidayDates);
        } else if (leave.Status === "Pending") {
          accumulator.pending += 1;
        } else if (leave.Status === "Rejected") {
          accumulator.rejected += 1;
        }

        return accumulator;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0, daysTaken: 0 },
    );
  }, [holidayDates, leaves]);

  // ? Available years ?
  const years = React.useMemo((): string[] => {
    const uniqueYears = new Set(
      leaves
        .map((leave) => new Date(leave.StartDate).getFullYear().toString())
        .filter((year) => year.length > 0 && year !== "NaN"),
    );

    return Array.from(uniqueYears).sort((a, b) => Number(b) - Number(a));
  }, [leaves]);

  // ? Filter + sort ?
  const filteredLeaves = React.useMemo((): ILeave[] => {
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();

    const filtered = leaves.filter((leave) => {
      if (statusFilter && leave.Status !== statusFilter) {
        return false;
      }

      if (leaveTypeFilter && leave.LeaveType !== leaveTypeFilter) {
        return false;
      }

      if (yearFilter) {
        const startYear = new Date(leave.StartDate).getFullYear().toString();
        const endYear = new Date(leave.EndDate).getFullYear().toString();

        if (startYear !== yearFilter && endYear !== yearFilter) {
          return false;
        }
      }

      if (normalizedSearchTerm) {
        const haystack = [
          leave.LeaveType,
          leave.Reason || "",
          leave.Status,
          getDateRange(leave.StartDate, leave.EndDate),
        ]
          .join(" ")
          .toLowerCase();

        if (haystack.indexOf(normalizedSearchTerm) < 0) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === "StartDate") {
        return (
          new Date(b.StartDate).getTime() - new Date(a.StartDate).getTime()
        );
      }

      if (sortKey === "AppliedDate") {
        return (
          new Date(b.AppliedDate || b.StartDate).getTime() -
          new Date(a.AppliedDate || a.StartDate).getTime()
        );
      }

      if (sortKey === "Status") {
        return a.Status.localeCompare(b.Status);
      }

      return a.LeaveType.localeCompare(b.LeaveType);
    });
  }, [leaves, leaveTypeFilter, searchTerm, sortKey, statusFilter, yearFilter]);

  // Reset pagination whenever the filters change
  React.useEffect((): void => {
    setPage(1);
  }, [leaveTypeFilter, searchTerm, sortKey, statusFilter, yearFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeaves.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);

  const pagedLeaves = React.useMemo((): ILeave[] => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLeaves.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredLeaves]);

  const hasActiveFilters = Boolean(
    statusFilter || leaveTypeFilter || yearFilter || searchTerm.trim(),
  );

  const clearFilters = (): void => {
    setStatusFilter("");
    setLeaveTypeFilter("");
    setYearFilter("");
    setSearchTerm("");
    setSortKey("StartDate");
  };

  // ? Export CSV ?
  const exportHistory = (): void => {
    const headers = [
      "Applied On",
      "Leave Type",
      "Start Date",
      "End Date",
      "Days",
      "Status",
      "Reason",
      "Approver Note",
      "Decision On",
    ];

    const rows = filteredLeaves.map((leave) => [
      leave.AppliedDate ? formatDate(leave.AppliedDate) : "-",
      leave.LeaveType,
      formatDate(leave.StartDate),
      formatDate(leave.EndDate),
      formatNumber(getLeaveDays(leave, holidayDates)),
      leave.Status,
      leave.Reason || "",
      leave.ApproverComments || "",
      leave.ApprovedDate ? formatDate(leave.ApprovedDate) : "-",
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
    link.download = `my-leave-history-${formatDateISO(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ? Cancel leave ?
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
      setSelectedLeave(null);
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

  // ? Detail helpers ?
  const getApproverNote = (leave: ILeave): string => {
    if (leave.Status === "Pending") {
      return "No approval note has been added yet.";
    }

    return leave.ApproverComments?.trim() || "No additional note provided.";
  };

  const getStatusColor = (status: TStatus): string =>
    STATUS_COLORS[status] || "#64748b";

  // Check if a leave overlaps with any other leave by the same employee
  const getOverlapInfo = (
    leave: ILeave,
  ): { hasOverlap: boolean; overlappingWith: ILeave[] } => {
    const overlapping = findOverlappingLeaves(
      leaves,
      leave.StartDate,
      leave.EndDate,
      {
        excludeId: leave.Id,
        employeeEmail: email,
        statuses: ["Pending", "Approved"],
      },
    ) as ILeave[];

    return {
      hasOverlap: overlapping.length > 0,
      overlappingWith: overlapping,
    };
  };

  // ? Render ?
  return (
    <MainLayout>
      <div className="historyPage">
        {/* Page Header */}
        <div className="historyHeader">
          <div>
            <h1 className="historyTitle">My Leave History</h1>
            <p className="historySubtitle">
              Every leave request you have applied for, with its outcome and
              approver notes
            </p>
          </div>

          <div className="historyActions">
            <button
              className="historyBtn"
              type="button"
              onClick={() => {
                fetchLeaves().catch((error) => {
                  console.error("Error refreshing leave history:", error);
                });
              }}
              disabled={loading}
            >
              Refresh
            </button>

            <button
              className="historyBtn primary"
              type="button"
              onClick={exportHistory}
              disabled={filteredLeaves.length === 0}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="historyStats">
          <div className="historyStatCard">
            <div className="historyStatIcon blue">
              <CalendarIcon />
            </div>
            <div className="historyStatValue">{stats.total}</div>
            <div className="historyStatLabel">Total Requests</div>
          </div>

          <div className="historyStatCard">
            <div className="historyStatIcon green">
              <CheckIcon />
            </div>
            <div className="historyStatValue">{stats.approved}</div>
            <div className="historyStatLabel">Approved</div>
            <div className="historyStatMeta">
              {formatNumber(stats.daysTaken)}{" "}
              {stats.daysTaken === 1 ? "day" : "days"} taken
            </div>
          </div>

          <div className="historyStatCard">
            <div className="historyStatIcon amber">
              <ClockIcon />
            </div>
            <div className="historyStatValue">{stats.pending}</div>
            <div className="historyStatLabel">Pending</div>
            <div className="historyStatMeta">awaiting review</div>
          </div>

          <div className="historyStatCard">
            <div className="historyStatIcon red">
              <XIcon />
            </div>
            <div className="historyStatValue">{stats.rejected}</div>
            <div className="historyStatLabel">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="historyFilterBar">
          <div className="historySearchBox">
            <input
              className="historySearchInput"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search leave type, reason, or dates..."
              aria-label="Search leave history"
            />
          </div>

          <div className="historyFilterButtons">
            {["", "Pending", "Approved", "Rejected"].map((status) => (
              <button
                key={status || "All"}
                className={`historyFilterBtn ${
                  statusFilter === status ? "active" : ""
                }`}
                type="button"
                onClick={() => setStatusFilter(status)}
              >
                {status || "All"}
              </button>
            ))}
          </div>

          <div className="historyFilterField">
            <label className="historyFilterLabel" htmlFor="historyTypeFilter">
              Leave Type
            </label>
            <select
              id="historyTypeFilter"
              className="historyFilterSelect"
              value={leaveTypeFilter}
              onChange={(event) => setLeaveTypeFilter(event.target.value)}
            >
              <option value="">All Types</option>
              {LEAVE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="historyFilterField">
            <label className="historyFilterLabel" htmlFor="historyYearFilter">
              Year
            </label>
            <select
              id="historyYearFilter"
              className="historyFilterSelect compact"
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="historyFilterField">
            <label className="historyFilterLabel" htmlFor="historySort">
              Sort
            </label>
            <select
              id="historySort"
              className="historyFilterSelect compact"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as TSortKey)}
            >
              <option value="StartDate">Start Date</option>
              <option value="AppliedDate">Applied Date</option>
              <option value="LeaveType">Leave Type</option>
              <option value="Status">Status</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              className="historyClearBtn"
              type="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="historyEmpty">
            <div className="historySpinner" aria-hidden="true" />
            <p className="historyEmptyText">Loading your leave history...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="historyEmpty">
            <div className="historyEmptyIcon">
              <CalendarIcon />
            </div>

            <h3 className="historyEmptyTitle">
              {hasActiveFilters
                ? "No leave records match your filters"
                : "You haven't applied for any leave yet"}
            </h3>

            <p className="historyEmptyText">
              {hasActiveFilters
                ? "Try changing or clearing the filters above."
                : "Once you apply for leave, your requests will appear here with their full history."}
            </p>

            {hasActiveFilters ? (
              <button
                className="historyBtn"
                type="button"
                onClick={clearFilters}
                style={{ marginTop: "16px" }}
              >
                Clear Filters
              </button>
            ) : (
              <a className="historyEmptyLink" href="#/apply-leave">
                Apply for leave
              </a>
            )}
          </div>
        ) : (
          <div className="historyTableWrap">
            <table className="historyTable">
              <thead>
                <tr>
                  <th>Applied On</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedLeaves.map((leave) => (
                  <tr key={leave.Id}>
                    <td className="historyMuted">
                      {leave.AppliedDate ? formatDate(leave.AppliedDate) : "-"}
                    </td>
                    <td>
                      <div className="historyTypeName">{leave.LeaveType}</div>
                      {getHalfDayLabel(leave.HalfDayType) && (
                        <span className="historyHalfBadge">
                          {getHalfDayLabel(leave.HalfDayType)} - half day
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="historyDateCell">
                        <span>{getDateRange(leave.StartDate, leave.EndDate)}</span>
                        {(() => {
                          const overlapInfo = getOverlapInfo(leave);
                          if (!overlapInfo.hasOverlap) return null;
                          return (
                            <span
                              className="historyOverlapBadge"
                              title={`Overlaps with: ${overlapInfo.overlappingWith.map((ol) => `${ol.LeaveType} (${ol.Status}): ${formatDate(ol.StartDate)} - ${formatDate(ol.EndDate)}`).join('; ')}`}
                            >
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
                    <td className="historyDuration">
                      {getDurationLabel(leave, holidayDates)}
                    </td>
                    <td>
                      <span
                        className="historyStatusBadge"
                        style={{
                          backgroundColor: getStatusColor(
                            leave.Status as TStatus,
                          ),
                        }}
                      >
                        {leave.Status}
                      </span>
                    </td>
                    <td className="historyReason">{leave.Reason || "-"}</td>
                    <td>
                      <div className="historyRowActions">
                        <button
                          className="historyActionBtn"
                          type="button"
                          onClick={() => setSelectedLeave(leave)}
                          aria-label="View leave details"
                          title="View details"
                        >
                          <EyeIcon />
                        </button>

                        {canCancelLeave(leave) && (
                          <button
                            className="historyActionBtn cancel"
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
                            aria-label="Cancel leave"
                            title="Cancel leave"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="historyPagination">
              <span className="historyPaginationInfo">
                Showing{" "}
                {(currentPage - 1) * PAGE_SIZE + 1}-
                {Math.min(currentPage * PAGE_SIZE, filteredLeaves.length)} of{" "}
                {filteredLeaves.length}
              </span>

              <button
                className="historyPaginationBtn"
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((previous) => previous - 1)}
              >
                Previous
              </button>

              <span className="historyPaginationInfo">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="historyPaginationBtn"
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((previous) => previous + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedLeave && (
          <div
            className="historyModalOverlay"
            onClick={() => setSelectedLeave(null)}
            role="presentation"
          >
            <div
              className="historyModal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="history-detail-title"
            >
              <div className="historyModalHeader">
                <div>
                  <h2 id="history-detail-title" className="historyModalTitle">
                    {selectedLeave.LeaveType}
                  </h2>
                  <p className="historyModalSubtitle">
                    {getDateRange(
                      selectedLeave.StartDate,
                      selectedLeave.EndDate,
                    )}{" "}
                    - {getDurationLabel(selectedLeave, holidayDates)}
                  </p>
                </div>

                <button
                  className="historyModalClose"
                  type="button"
                  onClick={() => setSelectedLeave(null)}
                  aria-label="Close leave details"
                >
                  <XIcon />
                </button>
              </div>

              <div className="historyModalBody">
                <div className="historyTimeline">
                  <div className="historyTimelineStep done">
                    <span className="historyTimelineDot" />
                    <span>
                      <span className="historyTimelineTitle">Applied</span>
                      <span className="historyTimelineMeta">
                        {selectedLeave.AppliedDate
                          ? formatDate(selectedLeave.AppliedDate)
                          : "-"}
                      </span>
                    </span>
                  </div>

                  <div
                    className={`historyTimelineStep ${
                      selectedLeave.Status === "Pending" ? "active" : "done"
                    }`}
                  >
                    <span className="historyTimelineDot" />
                    <span>
                      <span className="historyTimelineTitle">In Review</span>
                      <span className="historyTimelineMeta">
                        {selectedLeave.Status === "Pending"
                          ? "Awaiting manager review"
                          : "Review completed"}
                      </span>
                    </span>
                  </div>

                  <div
                    className={`historyTimelineStep ${
                      selectedLeave.Status === "Pending"
                        ? "upcoming"
                        : selectedLeave.Status === "Approved"
                          ? "done"
                          : "rejected"
                    }`}
                  >
                    <span className="historyTimelineDot" />
                    <span>
                      <span className="historyTimelineTitle">
                        {selectedLeave.Status === "Pending"
                          ? "Decision"
                          : selectedLeave.Status}
                      </span>
                      <span className="historyTimelineMeta">
                        {selectedLeave.Status === "Pending"
                          ? "Not decided yet"
                          : selectedLeave.ApprovedDate
                            ? formatDate(selectedLeave.ApprovedDate)
                            : "-"}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="historyDetailGrid">
                  <div className="historyDetailItem">
                    <span className="historyDetailLabel">Leave Type</span>
                    <span className="historyDetailValue">
                      {selectedLeave.LeaveType}
                    </span>
                  </div>

                  <div className="historyDetailItem">
                    <span className="historyDetailLabel">Status</span>
                    <span
                      className="historyStatusBadge"
                      style={{
                        backgroundColor: getStatusColor(
                          selectedLeave.Status as TStatus,
                        ),
                      }}
                    >
                      {selectedLeave.Status}
                    </span>
                  </div>

                  <div className="historyDetailItem">
                    <span className="historyDetailLabel">Start Date</span>
                    <span className="historyDetailValue">
                      {formatDate(selectedLeave.StartDate)}
                    </span>
                  </div>

                  <div className="historyDetailItem">
                    <span className="historyDetailLabel">End Date</span>
                    <span className="historyDetailValue">
                      {formatDate(selectedLeave.EndDate)}
                    </span>
                  </div>

                  <div className="historyDetailItem">
                    <span className="historyDetailLabel">Days Taken</span>
                    <span className="historyDetailValue">
                      {getDurationLabel(selectedLeave, holidayDates)}
                    </span>
                  </div>

                  <div className="historyDetailItem">
                    <span className="historyDetailLabel">Applied On</span>
                    <span className="historyDetailValue">
                      {selectedLeave.AppliedDate
                        ? formatDate(selectedLeave.AppliedDate)
                        : "-"}
                    </span>
                  </div>
                </div>

                {(() => {
                  const overlapInfo = getOverlapInfo(selectedLeave);
                  if (!overlapInfo.hasOverlap) return null;
                  return (
                    <div className="historyDetailSection">
                      <span className="historyDetailLabel">Leave Overlap</span>
                      <div className="historyOverlapWarning">
                        <div className="historyOverlapWarningHeader">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <span>Overlaps with {overlapInfo.overlappingWith.length} other leave(s)</span>
                        </div>
                        <div className="historyOverlapWarningList">
                          {overlapInfo.overlappingWith.map((ol) => (
                            <div key={ol.Id} className="historyOverlapWarningItem">
                              <span className="historyOverlapWarningType">{ol.LeaveType}</span>
                              <span className="historyOverlapWarningDates">
                                {ol.Status}: {formatDate(ol.StartDate)} - {formatDate(ol.EndDate)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="historyDetailSection">
                  <span className="historyDetailLabel">Reason</span>
                  <p className="historyDetailNote">{selectedLeave.Reason}</p>
                </div>

                <div className="historyDetailSection">
                  <span className="historyDetailLabel">Approver Note</span>
                  <p className="historyDetailNote">
                    {getApproverNote(selectedLeave)}
                  </p>
                </div>
              </div>

              {canCancelLeave(selectedLeave) && (
                <div className="historyModalFooter">
                  <button
                    className="historyModalCancelBtn"
                    type="button"
                    disabled={actioningId !== null}
                    onClick={() => {
                      handleCancelLeave(selectedLeave).catch((error) => {
                        console.error("Error cancelling leave:", error);
                      });
                    }}
                  >
                    Cancel this leave
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MyLeaveHistory;