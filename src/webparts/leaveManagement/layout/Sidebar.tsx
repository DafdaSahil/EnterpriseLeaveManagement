import * as React from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { menuItems } from "../utils/menuData";
import "./sidebar.css";

const BrandIcon = (): JSX.Element => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="3"
      width="6"
      height="6"
      rx="1.5"
      fill="white"
      fillOpacity={0.9}
    />
    <rect x="11" y="3" width="6" height="6" rx="1.5" fill="white" />
    <rect
      x="3"
      y="11"
      width="6"
      height="6"
      rx="1.5"
      fill="white"
      fillOpacity={0.6}
    />
    <rect
      x="11"
      y="11"
      width="6"
      height="6"
      rx="1.5"
      fill="white"
      fillOpacity={0.4}
    />
  </svg>
);

/** Returns initials from a display name, e.g. "Arjun Kumar" → "AK" */
const getInitials = (name?: string): string => {
  if (!name) return "U";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const Sidebar = (): JSX.Element => {
  const { user } = React.useContext(AuthContext);

  const filteredMenus = menuItems.filter(
    (menu) => menu.roles.indexOf(user?.Role || "") > -1,
  );

  // Separate admin-only items if you want section grouping.
  // Here we render all in one list; extend menuData with a `section` field
  // if you need "Main" / "Admin" labels.

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Brand */}
      <div className="logoRow">
        <div className="logoIcon">
          <BrandIcon />
        </div>
        <span className="logoText">LMS Portal</span>
      </div>

      {/* Nav label */}
      <span className="navLabel">Menu</span>

      {/* Nav items */}
      <div className="menu">
        {filteredMenus.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) => `menuItem ${isActive ? "active" : ""}`}
          >
            {/* If menuData has an `icon` field (Fluent icon name), render it;
                otherwise render a fallback dot. Extend as needed. */}
            {item.icon && (
              <span className="menuIcon" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer / user block */}
      <div className="sidebarFooter">
        <div className="userBlock">
          <div className="avatar" aria-hidden="true">
            {getInitials(user?.DisplayName || user?.Email)}
          </div>
          <div className="userInfo">
            <span className="userName">
              {user?.DisplayName || user?.Email || "User"}
            </span>
            <span className="userRole">{user?.Role}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
