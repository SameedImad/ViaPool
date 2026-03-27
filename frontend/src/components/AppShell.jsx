import { NavLink, useNavigate } from "react-router-dom";
import "../pages/AppShell.css";

/* Sidebar link config — driver vs passenger differs */
const DRIVER_LINKS = [
  { to: "/driver/dashboard",      icon: "📊", label: "Dashboard" },
  { to: "/driver/rides/create",   icon: "➕", label: "Post a Ride" },
  { to: "/driver/rides",          icon: "🗂️", label: "My Rides" },
  { to: "/driver/earnings",       icon: "💰", label: "Earnings" },
  { to: "/driver/vehicles",       icon: "🚗", label: "My Vehicles" },
];

const PASSENGER_LINKS = [
  { to: "/search",                icon: "🔍", label: "Find a Ride" },
  { to: "/passenger/bookings",    icon: "📋", label: "My Bookings" },
];

const SHARED_LINKS = [
  { to: "/profile",        icon: "👤", label: "Profile" },
  { to: "/notifications",  icon: "🔔", label: "Notifications", badge: 3 },
  { to: "/settings",       icon: "⚙️", label: "Settings" },
];

export default function AppShell({ children, title, role = "passenger", unreadCount = 0 }) {
  const navigate   = useNavigate();
  // TODO: get from Zustand auth store
  const user       = { name: "Arjun Sharma", role: role === "driver" ? "Driver" : "Passenger", letter: "A" };
  const activeLinks = role === "driver" ? DRIVER_LINKS : PASSENGER_LINKS;

  const handleLogout = () => {
    // TODO: clear Zustand store, disconnect socket, navigate to /login
    navigate("/login");
  };

  return (
    <div className="app-shell">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-logo">
          <span className="logo-pill">VP</span>
          ViaPool
        </NavLink>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">{role === "driver" ? "Driver" : "Passenger"}</div>
          {activeLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <span className="sl-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}

          <div className="sidebar-section-label">Account</div>
          {SHARED_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <span className="sl-icon">{link.icon}</span>
              {link.label}
              {link.badge > 0 && <span className="sl-badge">{link.badge}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User block */}
        <div className="sidebar-bottom">
          <div className="sidebar-user" onClick={handleLogout} title="Click to sign out">
            <div className="su-av">{user.letter}</div>
            <div>
              <div className="su-name">{user.name}</div>
              <div className="su-role">{user.role} · Sign out</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="page-content">
        <header className="page-topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-right">
            <button
              className="topbar-bell"
              onClick={() => navigate("/notifications")}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
            </button>
            <div className="su-av" style={{ cursor: "pointer" }} onClick={() => navigate("/profile")}>
              {user.letter}
            </div>
          </div>
        </header>
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}
