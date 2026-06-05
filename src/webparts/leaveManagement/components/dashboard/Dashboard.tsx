import * as React from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { AuthContext } from "../../context/AuthContext";
import {
  getLeaves,
  getLeaveBalance,
  getEmployees,
} from "../../services/SPService";
import { ILeave } from "../../interfaces/ILeave";
import "./dashboard.css";

interface IStatCard {
  label: string;
  value: number | string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  color: "blue" | "green" | "amber" | "red";
  icon: React.ReactNode;
}

const LeafIcon = (): JSX.Element => (
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
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
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

const PeopleIcon = (): JSX.Element => (
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// ── Stat Card ───────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  change,
  changeType,
  color,
  icon,
}: IStatCard): JSX.Element => (
  <div className="statCard">
    <div className={`statIcon ${color}`}>{icon}</div>
    <div className="statValue">{value}</div>
    <div className="statLabel">{label}</div>

    {change && (
      <div
        className={`statChange ${
          changeType === "up" ? "up" : changeType === "down" ? "down" : ""
        }`}
      >
        {change}
      </div>
    )}
  </div>
);

// ── Leave row ───────────────────────────────────────────────
type TStatus = "Pending" | "Approved" | "Rejected";

interface ILeaveRow {
  name: string;
  type: string;
  dates: string;
  status: TStatus;
}

const statusClass: Record<TStatus, string> = {
  Pending: "chipPending",
  Approved: "chipApproved",
  Rejected: "chipRejected",
};

const dotColor: Record<TStatus, string> = {
  Pending: "#d97706",
  Approved: "#16a34a",
  Rejected: "#dc2626",
};

const LeaveRow = ({ name, type, dates, status }: ILeaveRow): JSX.Element => (
  <div className="leaveRow">
    <div className="leaveInfo">
      <div
        className="leaveDot"
        style={{ background: dotColor[status] }}
        aria-hidden="true"
      />

      <div>
        <div className="leaveName">{name}</div>

        <div className="leaveType">
          {type} · {dates}
        </div>
      </div>
    </div>

    <span className={`chip ${statusClass[status]}`}>{status}</span>
  </div>
);

// ── Dashboard ───────────────────────────────────────────────
const Dashboard = (): JSX.Element => {
  const navigate = useNavigate();

  const { user } = React.useContext(AuthContext);

  const [leaves, setLeaves] = React.useState<ILeave[]>([]);

  const [employees, setEmployees] = React.useState<any[]>([]);

  const [leaveBalance, setLeaveBalance] = React.useState<{
    [key: string]: { used: number; total: number };
  }>({});

  const [, setLoading] = React.useState(true);

  // ── Fetch data ───────────────────────────────────────────
  React.useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setLoading(true);

      try {
        const allLeaves = await getLeaves();

        setLeaves(allLeaves);

        const employeeData = await getEmployees();

        setEmployees(employeeData);

        if (user?.Email) {
          const balance = await getLeaveBalance(user.Email);

          setLeaveBalance(balance);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch(console.error);
  }, [user]);

  // ── Helpers ──────────────────────────────────────────────
  const getStatValue = (status: string): number => {
    const filtered = leaves.filter((l) => l.Status === status);

    if (user?.Role === "Employee") {
      return filtered.filter((l) => l.EmployeeEmail === user.Email).length;
    }

    return filtered.length;
  };

  const getAvailableLeaves = (): number => {
    let total = 0;

    Object.values(leaveBalance).forEach((balance) => {
      total += balance.total - balance.used;
    });

    return total;
  };

  // ── Employee Stats ───────────────────────────────────────
  const employeeStats: IStatCard[] = [
    {
      label: "Available Leaves",
      value: getAvailableLeaves(),
      change: "days remaining",
      changeType: "neutral",
      color: "blue",
      icon: <LeafIcon />,
    },
    {
      label: "Approved",
      value: getStatValue("Approved"),
      change: "this year",
      changeType: "neutral",
      color: "green",
      icon: <CheckIcon />,
    },
    {
      label: "Pending",
      value: getStatValue("Pending"),
      change: "awaiting action",
      changeType: "down",
      color: "amber",
      icon: <ClockIcon />,
    },
    {
      label: "Rejected",
      value: getStatValue("Rejected"),
      change: "this year",
      changeType: "neutral",
      color: "red",
      icon: <XIcon />,
    },
  ];

  // ── Admin Stats ──────────────────────────────────────────
  const adminStats: IStatCard[] = [
    {
      label: "Total Employees",
      value: employees.length,
      change: "active users",
      changeType: "neutral",
      color: "blue",
      icon: <PeopleIcon />,
    },
    {
      label: "Pending Requests",
      value: getStatValue("Pending"),
      change: "needs review",
      changeType: "down",
      color: "amber",
      icon: <ClockIcon />,
    },
    {
      label: "Approved Leaves",
      value: getStatValue("Approved"),
      change: "processed",
      changeType: "up",
      color: "green",
      icon: <CheckIcon />,
    },
    {
      label: "Rejected Requests",
      value: getStatValue("Rejected"),
      change: "this month",
      changeType: "neutral",
      color: "red",
      icon: <XIcon />,
    },
  ];

  // ── Recent Leaves ────────────────────────────────────────
  const getRecentLeaves = (): ILeaveRow[] => {
    let filtered = leaves;

    if (user?.Role === "Employee") {
      filtered = filtered.filter((l) => l.EmployeeEmail === user.Email);
    }

    return filtered.slice(0, 4).map((leave) => ({
      name: leave.EmployeeEmail,
      type: leave.LeaveType,
      dates: `${new Date(leave.StartDate).getDate()} - ${new Date(leave.EndDate).getDate()}`,
      status: leave.Status as TStatus,
    }));
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="pageHeader">
        <h1 className="pageTitle">Dashboard</h1>

        <p className="pageSubtitle">
          {user?.Role === "Employee"
            ? "Your leave overview at a glance"
            : "Team leave management overview"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="statsGrid">
        {(user?.Role === "Employee" ? employeeStats : adminStats).map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Panels */}
      <div className="panelGrid">
        {/* Recent Requests */}
        <div className="panel">
          <div className="panelHeader">
            <h2 className="panelTitle">
              {user?.Role === "Employee"
                ? "My recent leaves"
                : "Recent requests"}
            </h2>

            <button
              className="viewAllBtn"
              onClick={() => navigate("/leave-list")}
            >
              View all
            </button>
          </div>

          <div>
            {getRecentLeaves().length > 0 ? (
              getRecentLeaves().map((l) => (
                <LeaveRow key={l.name + l.dates} {...l} />
              ))
            ) : (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                No leaves found
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="panel">
          <div className="panelHeader">
            <h2 className="panelTitle">
              {user?.Role === "Employee" ? "Quick actions" : "Admin actions"}
            </h2>
          </div>

          {user?.Role === "Employee" ? (
            <>
              <div className="actionGrid">
                <button
                  className="actionBtn primary"
                  onClick={() => navigate("/apply-leave")}
                >
                  Apply for leave
                </button>

                <button
                  className="actionBtn"
                  onClick={() => navigate("/leave-list")}
                >
                  View my history
                </button>
              </div>

              {/* Leave Balance */}
              <div className="leaveBalance">
                <div className="balanceTitle">Leave balance</div>

                {Object.entries(leaveBalance).map(([type, balance]) => (
                  <div key={type} className="balanceRow">
                    <div className="balanceLabel">
                      <span>{type}</span>

                      <span className="balanceCount">
                        {balance.total - balance.used}/{balance.total}
                      </span>
                    </div>

                    <div className="progressBar">
                      <div
                        className="progressFill"
                        style={{
                          width: `${((balance.total - balance.used) / balance.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: "20px" }}>
              <div className="balanceRow">
                <span style={{ color: "#64748b" }}>
                  Total pending requests: {getStatValue("Pending")}
                </span>
              </div>

              <button
                className="actionBtn primary"
                onClick={() => navigate("/leave-list")}
                style={{
                  width: "100%",
                  marginTop: "12px",
                }}
              >
                Review Requests
              </button>

              <button
                className="actionBtn"
                onClick={() => navigate("/employees")}
                style={{
                  width: "100%",
                  marginTop: "12px",
                }}
              >
                Manage Employees
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
