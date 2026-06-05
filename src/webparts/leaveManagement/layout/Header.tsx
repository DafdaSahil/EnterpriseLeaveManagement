import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./header.css";

/** Friendly greeting based on current hour */
const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/** Formats today's date as "Tuesday, 26 May 2026" */
const formatDate = (): string =>
  new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const Header = (): JSX.Element => {
  const navigate = useNavigate();
  const { logout, user } = React.useContext(AuthContext);

  const displayName =
    user?.DisplayName || user?.Email?.split("@")[0] || "there";

  const handleLogout = (): void => {
    logout();
    navigate("/");
  };

  return (
    <header className="header">
      <div className="left">
        <span className="greeting">
          {getGreeting()}, {displayName}
        </span>
        <span className="date">{formatDate()}</span>
      </div>

      <div className="right">
        <button
          className="logoutBtn"
          onClick={handleLogout}
          aria-label="Sign out"
        >
          {/* Logout icon */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </div>
    </header>
  );
};

export default Header;
