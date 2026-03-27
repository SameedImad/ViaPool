import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Briefcase, 
  Wallet, 
  Car, 
  Search, 
  ClipboardList, 
  User, 
  Bell, 
  Settings, 
  LogOut,
  ArrowLeftRight
} from "lucide-react";
import api from "../lib/api";
import "../pages/AppShell.css";

const DRIVER_LINKS = [
  { to: "/driver/dashboard",      icon: LayoutDashboard, label: "Dashboard" },
  { to: "/driver/rides/create",   icon: PlusCircle,      label: "Post a Ride" },
  { to: "/driver/rides",          icon: Briefcase,       label: "My Rides" },
  { to: "/driver/earnings",       icon: Wallet,          label: "Earnings" },
  { to: "/driver/vehicles",       icon: Car,             label: "My Vehicles" },
];

const PASSENGER_LINKS = [
  { to: "/search",                icon: Search,          label: "Find a Ride" },
  { to: "/passenger/bookings",    icon: ClipboardList,   label: "My Bookings" },
];

// SHARED_LINKS will now have dynamic badges handled in the render
const SHARED_LINKS = [
  { to: "/profile",        icon: User,     label: "Profile" },
  { to: "/notifications",  icon: Bell,     label: "Notifications" },
  { to: "/settings",       icon: Settings, label: "Settings" },
];

export default function AppShell({ children, title, role: initialRole = "passenger" }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState(localStorage.getItem("via-role") || initialRole);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          api.get("/api/v1/auth/current-user"),
          api.get("/api/v1/notifications/unread-count")
        ]);

        if (results[0].status === "fulfilled") {
          setUser(results[0].value.data);
        }
        if (results[1].status === "fulfilled") {
          setUnreadCount(results[1].value.data?.unreadCount || 0);
        }
      } catch (err) {
        console.error("Failed to fetch sidebar data", err);
        if (err.status === 401) {
          localStorage.removeItem("via-token");
          navigate("/login");
        }
      }
    };
    fetchData();
  }, [location.key]);

  const handleLogout = () => {
    localStorage.removeItem("via-token");
    navigate("/login");
  };

  const toggleRole = () => {
    const newRole = role === "driver" ? "passenger" : "driver";
    setRole(newRole);
    localStorage.setItem("via-role", newRole);
    navigate(newRole === "driver" ? "/driver/dashboard" : "/search");
  };

  const activeLinks = role === "driver" ? DRIVER_LINKS : PASSENGER_LINKS;

  return (
    <div className="app-shell">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-logo">
          <span className="logo-pill">VP</span>
          ViaPool
        </NavLink>

        <nav className="sidebar-nav">
          <div className="sidebar-section-container">
              <div className="sidebar-section-label">{role === "driver" ? "Driver" : "Passenger"} View</div>
              <button className="role-switch-btn" onClick={toggleRole}>
                <ArrowLeftRight size={14} />
                Switch to {role === "driver" ? "Passenger" : "Driver"}
              </button>
          </div>
          
          {activeLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <link.icon className="sl-icon" size={20} />
              {link.label}
            </NavLink>
          ))}

          <div className="sidebar-section-label">Account</div>
          {SHARED_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <link.icon className="sl-icon" size={20} />
              {link.label}
              {link.label === "Notifications" && unreadCount > 0 && (
                  <span className="sl-badge">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User block */}
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="su-av">
                {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.firstName} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                    user?.firstName?.[0] || "U"
                )}
            </div>
            <div className="su-info">
              <div className="su-name">{user?.firstName || "Loading..."} {user?.lastName}</div>
              <div className="su-role" onClick={handleLogout} style={{cursor: 'pointer'}}>
                  <LogOut size={12} style={{display: 'inline', marginRight: 4}} />
                  Sign out
              </div>
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
              <Bell size={20} />
              {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
            </button>
            <div 
                className="su-av" 
                style={{ cursor: "pointer", width: 34, height: 34 }} 
                onClick={() => navigate("/profile")}
            >
              {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Me" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                    user?.firstName?.[0] || "U"
                )}
            </div>
          </div>
        </header>
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}
