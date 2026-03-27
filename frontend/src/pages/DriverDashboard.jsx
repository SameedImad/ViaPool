import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Driver.css";

const UPCOMING = [
  { id: "r1", from: "Hitech City", to: "Banjara Hills", time: "08:45 AM", seats: 3, fare: "₹240", status: "active",  passengers: 2 },
  { id: "r2", from: "Gachibowli",  to: "Secunderabad",  time: "06:30 PM", seats: 4, fare: "₹180", status: "pending", passengers: 1 },
];

const WEEK_EARNINGS = [
  { day: "Mon", amt: 420,  h: "45%" },
  { day: "Tue", amt: 680,  h: "72%" },
  { day: "Wed", amt: 0,    h: "4%"  },
  { day: "Thu", amt: 910,  h: "97%" },
  { day: "Fri", amt: 760,  h: "81%" },
  { day: "Sat", amt: 520,  h: "55%" },
  { day: "Sun", amt: 340,  h: "36%" },
];

const STATUS_COLOR = { active: "badge-verified", pending: "badge-pending", completed: "badge-rejected" };
const STATUS_LABEL = { active: "Active", pending: "Pending", completed: "Completed" };

export default function DriverDashboard() {
  const navigate = useNavigate();
  const total    = WEEK_EARNINGS.reduce((s, d) => s + d.amt, 0);

  return (
    <AppShell title="Driver Dashboard" role="driver" unreadCount={3}>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-eyebrow">Good morning, Arjun 👋</div>
        <h1 className="page-header-title">Your <em>Dashboard</em></h1>
      </div>

      {/* ── Stats row ── */}
      <div className="stat-grid">
        {[
          { label: "This week",         value: `₹${total.toLocaleString()}`, sub: "+18% from last week" },
          { label: "Active rides",       value: "2",     sub: "1 today" },
          { label: "Avg rating",         value: "4.9★",  sub: "from 24 rides" },
          { label: "Acceptance rate",    value: "94%",   sub: "last 30 days" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        {/* ── Upcoming rides ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--ink)" }}>Upcoming Rides</div>
            <button className="btn-primary" style={{ fontSize: "0.85rem", padding: "9px 20px" }} onClick={() => navigate("/driver/rides/create")}>
              + Post a Ride
            </button>
          </div>
          {UPCOMING.map(r => (
            <div className="dash-ride-card" key={r.id} style={{ marginBottom: 10, cursor: "pointer" }} onClick={() => navigate(`/driver/rides/${r.id}`)}>
              <div style={{ fontSize: "1.8rem" }}>🗺️</div>
              <div className="drc-route">
                <div className="drc-cities">{r.from} → {r.to}</div>
                <div className="drc-meta">{r.time} · {r.passengers}/{r.seats} passengers</div>
              </div>
              <span className={`badge ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
              <div className="drc-fare">
                <div className="drc-amt">{r.fare}</div>
                <div className="drc-seats">per seat</div>
              </div>
            </div>
          ))}
          {UPCOMING.length === 0 && (
            <div className="info-card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🚗</div>
              <p style={{ color: "var(--mist)", fontSize: "0.92rem" }}>No upcoming rides. Post one to get started.</p>
              <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("/driver/rides/create")}>Post a Ride →</button>
            </div>
          )}
        </div>

        {/* ── Earnings mini chart ── */}
        <div className="info-card">
          <div className="info-card-title">This Week's Earnings</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 20 }}>
            ₹{total.toLocaleString()}
          </div>
          <div className="earnings-bar-chart" style={{ marginBottom: 8 }}>
            {WEEK_EARNINGS.map(d => (
              <div className="ebc-col" key={d.day}>
                <div className="ebc-amt">{d.amt > 0 ? `₹${d.amt}` : ""}</div>
                <div className="ebc-bar-wrap">
                  <div className="ebc-bar" style={{ height: d.h }} />
                </div>
                <div className="ebc-day">{d.day}</div>
              </div>
            ))}
          </div>
          <button className="btn-outline" style={{ width: "100%", marginTop: 16 }} onClick={() => navigate("/driver/earnings")}>
            View full earnings →
          </button>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 24 }}>
        {[
          { icon: "🚗", label: "My Vehicles",  to: "/driver/vehicles" },
          { icon: "💰", label: "Earnings",      to: "/driver/earnings" },
          { icon: "👤", label: "My Profile",    to: "/profile" },
          { icon: "⚙️", label: "Settings",      to: "/settings" },
        ].map(q => (
          <button
            key={q.label}
            onClick={() => navigate(q.to)}
            style={{
              padding: "20px 16px", borderRadius: 16, border: "1.5px solid var(--sand)",
              background: "var(--parchment)", cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 12,
              fontFamily: "var(--font-sans)", fontSize: "0.9rem", fontWeight: 600, color: "var(--ink)",
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>{q.icon}</span> {q.label}
          </button>
        ))}
      </div>
    </AppShell>
  );
}
