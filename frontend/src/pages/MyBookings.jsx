import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

// Dynamic bookings will be fetched from API

const STATUS_BADGE = {
  upcoming:  "badge-pending",
  completed: "badge-verified",
  cancelled: "badge-rejected",
};
const STATUS_ICON = {
  upcoming:  "⏳",
  completed: "✅",
  cancelled: "❌",
};

const TABS = ["All", "Upcoming", "Completed", "Cancelled"];

export default function MyBookings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("All");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/api/v1/bookings/my-bookings");
        const formatted = (res.data.data || []).map(b => {
          const d = new Date(b.ride?.departureTime);
          const status = b.bookingStatus === "cancelled" ? "cancelled" : (b.ride?.status === "completed" ? "completed" : "upcoming");
          return {
            id: b._id,
            from: b.ride?.from?.address?.split(',')[0] || "Unknown",
            to: b.ride?.to?.address?.split(',')[0] || "Unknown",
            date: d.toLocaleDateString(),
            time: d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            seats: b.seatsBooked,
            amount: b.totalPrice,
            status,
            driver: b.ride?.driver ? `${b.ride.driver.firstName} ${b.ride.driver.lastName}` : "Unknown",
            rideId: b.ride?._id
          };
        });
        setBookings(formatted);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filtered = bookings.filter(b =>
    tab === "All" ? true : b.status === tab.toLowerCase()
  );

  return (
    <AppShell title="My Bookings" role="passenger" unreadCount={2}>
      <div className="page-header">
        <div className="page-header-eyebrow">Passenger</div>
        <h1 className="page-header-title">My <em>Bookings</em></h1>
        <div className="page-header-sub">View and manage all your ride bookings</div>
      </div>

      {/* Stats row */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {[
          { label: "Total rides",    value: bookings.length,                          sub: "all time" },
          { label: "Completed",      value: bookings.filter(b => b.status === "completed").length, sub: "rides taken" },
          { label: "Upcoming",       value: bookings.filter(b => b.status === "upcoming").length,  sub: "booked" },
          { label: "Total spent",    value: `₹${bookings.filter(b => b.status !== "cancelled").reduce((s,b) => s + b.amount, 0)}`, sub: "on rides" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {loading ? (
        <div className="info-card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <span className="auth-spinner" style={{display: 'inline-block', marginBottom: 16}} />
          <div className="info-card-title">Loading bookings...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="info-card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📋</div>
          <p style={{ color: "var(--mist)", fontSize: "0.92rem" }}>No {tab.toLowerCase()} bookings yet.</p>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("/search")}>Find a Ride →</button>
        </div>
      ) : (
        filtered.map(b => (
          <div key={b.id} className="booking-card" onClick={() => navigate(`/passenger/bookings/${b.id}`)}>
            <div className="bc-icon">{STATUS_ICON[b.status]}</div>
            <div className="bc-info">
              <div className="bc-route">{b.from} → {b.to}</div>
              <div className="bc-meta">{b.date} · {b.time} · {b.seats} seat{b.seats !== 1 ? "s" : ""} · {b.driver}</div>
            </div>
            <div className="bc-right">
              <div className="bc-amount">₹{b.amount}</div>
              <span className={`badge ${STATUS_BADGE[b.status]}`}>{b.status}</span>
            </div>
          </div>
        ))
      )}
    </AppShell>
  );
}
