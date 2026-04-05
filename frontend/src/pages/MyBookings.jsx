import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ClipboardList, 
  MapPin, 
  Wallet, 
  TrendingUp, 
  Users,
  Search,
  ArrowRight
} from "lucide-react";
import api from "../lib/api";
import { logger } from "../lib/logger";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Auth.css";
import "../pages/Passenger.css";

const STATUS_MAP = {
  upcoming:  { badge: "badge-pending", icon: Clock, color: "var(--ember)" },
  completed: { badge: "badge-verified", icon: CheckCircle, color: "var(--forest)" },
  cancelled: { badge: "badge-rejected", icon: XCircle, color: "var(--terracotta)" },
};

const TABS = ["All", "Upcoming", "Completed", "Cancelled"];

export default function MyBookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("All");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeRole = localStorage.getItem("via-role") || "passenger";

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/api/v1/bookings/my-bookings");
        const formatted = (res.data || []).map(b => {
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
        logger.error("Failed to fetch bookings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [location.key]);

  const filtered = bookings.filter(b =>
    tab === "All" ? true : b.status === tab.toLowerCase()
  );

  return (
    <AppShell title="My Bookings" role={activeRole} unreadCount={2}>
      <div className="page-header">
        <div className="page-header-eyebrow">Passenger</div>
        <h1 className="page-header-title">My <em>Bookings</em></h1>
        <div className="page-header-sub">View and manage all your ride bookings</div>
      </div>

      {/* Stats row */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {[
          { label: "Total rides",    value: bookings.length,                          sub: "all time", icon: ClipboardList },
          { label: "Completed",      value: bookings.filter(b => b.status === "completed").length, sub: "rides taken", icon: CheckCircle },
          { label: "Upcoming",       value: bookings.filter(b => b.status === "upcoming").length,  sub: "booked", icon: Clock },
          { label: "Total spent",    value: `₹${bookings.filter(b => b.status !== "cancelled").reduce((s,b) => s + b.amount, 0)}`, sub: "on rides", icon: Wallet },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <div className="stat-label">{s.label}</div>
                <s.icon size={16} style={{opacity: 0.3}} />
            </div>
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
          <div style={{ marginBottom: 20, color: 'var(--mist)' }}><ClipboardList size={54} strokeWidth={1} /></div>
          <p style={{ color: "var(--mist)", fontSize: "0.92rem" }}>No {tab.toLowerCase()} bookings yet.</p>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("/search")}>Find a Ride <Search size={16} /></button>
        </div>
      ) : (
        <div className="bookings-list" style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          {filtered.map(b => {
             const S = STATUS_MAP[b.status];
             return (
              <div key={b.id} className="booking-card-modern" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', background: 'var(--parchment)', borderRadius: 16, border: '1px solid var(--sand)', cursor: 'pointer' }} onClick={() => navigate(`/passenger/bookings/${b.id}`)}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyCenter: 'center', marginRight: 16 }}>
                    <S.icon size={20} color={S.color} style={{margin: '0 auto'}} />
                </div>
                <div className="bc-info" style={{flex: 1}}>
                  <div className="bc-route" style={{fontWeight: 700, color: 'var(--ink)'}}>{b.from} → {b.to}</div>
                  <div className="bc-meta" style={{fontSize: '0.82rem', color: 'var(--mist)', marginTop: 2}}>{b.date} · {b.time} · {b.seats} seat{b.seats !== 1 ? "s" : ""} · {b.driver}</div>
                </div>
                <div className="bc-right" style={{textAlign: 'right'}}>
                  <div className="bc-amount" style={{fontWeight: 800, color: 'var(--ink)', fontSize: '1.1rem'}}>₹{b.amount}</div>
                  <span className={`badge ${S.badge}`} style={{marginTop: 4, display: 'inline-block'}}>{b.status}</span>
                </div>
                <div style={{marginLeft: 20, color: 'var(--sand)'}}>
                    <ArrowRight size={18} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
