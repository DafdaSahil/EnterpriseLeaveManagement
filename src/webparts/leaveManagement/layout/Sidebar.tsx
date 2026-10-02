import * as React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { menuItems } from "../utils/menuData";
import "./sidebar.css";

const ThreeDotsIcon = (): JSX.Element => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="8" cy="3" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="8" cy="13" r="1.5" />
  </svg>
);

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
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const filteredMenus = menuItems.filter(
    (menu) => menu.roles.indexOf(user?.Role || "") > -1,
  );

  // Close the dropdown when clicking anywhere outside of it.
  React.useEffect((): (() => void) => {
    if (!menuOpen) {
      return () => {
        // no-op
      };
    }

    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleUpdateProfile = (): void => {
    setMenuOpen(false);
    navigate("/profile");
  };

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
        <div className="userBlock" ref={menuRef}>
          <div className="avatar" aria-hidden="true">
            {getInitials(user?.DisplayName || user?.Email)}
          </div>
          <div className="userInfo">
            <span className="userName">
              {user?.DisplayName || user?.Email || "User"}
            </span>
            <span className="userRole">{user?.Role}</span>
          </div>
          <div className="userMenu">
            <button
              className="menuTrigger"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="User menu"
              aria-expanded={menuOpen}
            >
              <ThreeDotsIcon />
            </button>
            {menuOpen && (
              <div className="dropdownMenu" role="menu">
                <button
                  className="dropdownItem"
                  role="menuitem"
                  onClick={handleUpdateProfile}
                >
                  Update Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
