import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  TrendingUp, 
  Star, 
  CheckCircle, 
  Clock, 
  Car, 
  Wallet, 
  User, 
  Settings,
  Plus,
  ArrowRight
} from "lucide-react";
import AppShell from "../components/AppShell";
import api from "../lib/api";
import "../pages/AppShell.css";
import "../pages/Driver.css";

// UPCOMING and WEEK_EARNINGS now managed by state

const STATUS_MAP = {
  active: { cls: "badge-verified", text: "Active", icon: CheckCircle },
  pending: { cls: "badge-pending", text: "Pending", icon: Clock },
  completed: { cls: "badge-verified", text: "Completed", icon: CheckCircle },
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [stats, setStats] = useState({
      weeklyEarnings: 0,
      activeRides: 0,
      avgRating: 0,
      acceptanceRate: "0%"
  });
  const [earningsChart, setEarningsChart] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const activeRole = localStorage.getItem("via-role") || "driver";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userRes, dashRes] = await Promise.all([
            api.get("/api/v1/auth/current-user"),
            api.get("/api/v1/rides/driver/dashboard")
        ]);
        
        setUser(userRes.data.data);
        
        const d = dashRes.data.data;
        setUpcoming(d.upcomingRides || []);
        setStats(d.stats || {});
        setEarningsChart(d.weeklyChart || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <AppShell title="Driver Dashboard" role={activeRole}>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-eyebrow">Greetings, {user?.firstName || "Driver"}</div>
        <h1 className="page-header-title">Your <em>Dashboard</em></h1>
      </div>

      {/* ── Stats row ── */}
      <div className="stat-grid">
        {[
          { label: "This week",         value: `₹${(stats.weeklyEarnings || 0).toLocaleString()}`, sub: "Earnings so far", icon: Wallet },
          { label: "Active rides",       value: stats.activeRides || "0",     sub: "Scheduled/Ongoing", icon: Car },
          { label: "Avg rating",         value: (stats.avgRating || 0).toFixed(1),  sub: `from ${stats.totalRides || 0} rides`, icon: Star },
          { label: "Acceptance rate",    value: stats.acceptanceRate || "95%",   sub: "last 30 days", icon: TrendingUp },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                <div className="stat-label">{s.label}</div>
                <s.icon size={18} style={{opacity: 0.2}} />
            </div>
            <div className="stat-value">{s.value}{s.label === "Avg rating" && "★"}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="dash-main-content" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* ── Upcoming rides ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", color: "var(--ink)" }}>Upcoming Rides</div>
            <button className="btn-primary" style={{ fontSize: "0.85rem", padding: "9px 20px", display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate("/driver/rides/create")}>
              <Plus size={16} /> Post a Ride
            </button>
          </div>
          {upcoming.map(r => {
            const S = STATUS_MAP[r.status] || STATUS_MAP.pending;
            const depDate = new Date(r.departureTime);
            return (
              <div className="dash-ride-card" key={r._id} style={{ marginBottom: 12, cursor: "pointer", display: 'flex', alignItems: 'center', padding: '16px 20px', background: 'var(--parchment)', borderRadius: 16, border: '1px solid var(--sand)' }} onClick={() => navigate(`/driver/rides/${r._id}`)}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyCenter: 'center', marginRight: 16 }}>
                    <MapPin size={24} color="var(--terracotta)" style={{margin: '0 auto'}} />
                </div>
                <div className="drc-route" style={{flex: 1}}>
                  <div className="drc-cities" style={{fontWeight: 700, color: 'var(--ink)'}}>
                    {r.from?.address?.split(',')[0]} → {r.to?.address?.split(',')[0]}
                  </div>
                  <div className="drc-meta" style={{fontSize: '0.82rem', color: 'var(--mist)', marginTop: 2}}>
                    {depDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} · {r.passengersCount || 0}/{r.totalSeats - 1} passengers
                  </div>
                </div>
                <span className={`badge ${S.cls}`} style={{marginRight: 20}}>
                    <S.icon size={12} style={{marginRight: 4}} /> {S.text}
                </span>
                <div className="drc-fare" style={{textAlign: 'right'}}>
                  <div className="drc-amt" style={{fontWeight: 800, color: 'var(--forest)', fontSize: '1.2rem'}}>₹{r.pricePerSeat}</div>
                  <div className="drc-seats" style={{fontSize: '0.7rem', color: 'var(--mist)'}}>per seat</div>
                </div>
              </div>
            );
          })}
          {upcoming.length === 0 && !loading && (
            <div className="info-card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ color: "var(--mist)", marginBottom: 16 }}><Car size={48} strokeWidth={1} /></div>
              <p style={{ color: "var(--mist)", fontSize: "0.92rem" }}>No upcoming rides. Post one to get started.</p>
              <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("/driver/rides/create")}>Post a Ride <ArrowRight size={16} /></button>
            </div>
          )}
        </div>

        {/* ── Earnings mini chart ── */}
        <div className="info-card">
          <div className="info-card-title">This Week's Earnings</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "2.2rem", color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 20 }}>
            ₹{(stats.weeklyEarnings || 0).toLocaleString()}
          </div>
          <div className="earnings-bar-chart" style={{ marginBottom: 8 }}>
            {earningsChart.map(d => (
              <div className="ebc-col" key={d.day}>
                <div className="ebc-amt">{d.amt > 0 ? `₹${d.amt.toLocaleString()}` : ""}</div>
                <div className="ebc-bar-wrap">
                  <div className="ebc-bar" style={{ height: d.h }} />
                </div>
                <div className="ebc-day">{d.day}</div>
              </div>
            ))}
          </div>
          <button className="btn-outline" style={{ width: "100%", marginTop: 16 }} onClick={() => navigate("/driver/earnings")}>
            View full earnings <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div className="dash-quick-links" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 24 }}>
        {[
          { icon: Car,      label: "My Vehicles",  to: "/driver/vehicles" },
          { icon: Wallet,   label: "Earnings",      to: "/driver/earnings" },
          { icon: User,     label: "My Profile",    to: "/profile" },
          { icon: Settings, label: "Settings",      to: "/settings" },
        ].map(q => (
          <button
            key={q.label}
            onClick={() => navigate(q.to)}
            style={{
              padding: "20px 24px", borderRadius: 16, border: "1.5px solid var(--sand)",
              background: "var(--parchment)", cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 14,
              fontFamily: "var(--font-sans)", fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)",
            }}
            className="quick-link-btn"
          >
            <q.icon size={22} color="var(--terracotta)" />
            {q.label}
          </button>
        ))}
      </div>
    </AppShell>
  );
}
