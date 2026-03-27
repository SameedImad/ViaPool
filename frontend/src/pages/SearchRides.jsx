import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

const CITIES = [
  "Hyderabad", "Bangalore", "Chennai", "Mumbai", "Pune", "Delhi",
  "Gurgaon", "Noida", "Kolkata", "Ahmedabad", "Jaipur", "Bhopal",
  "Hitech City", "Banjara Hills", "Gachibowli", "Secunderabad",
  "Madhapur", "Kondapur", "Jubilee Hills", "Kukatpally",
];

const FILTERS = ["All", "AC", "Ladies-only", "No Smoking", "Pets Allowed", "Verified"];

export default function SearchRides() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("1");
  const [activeFilter, setActiveFilter] = useState("All");
  const [fromSugg, setFromSugg] = useState([]);
  const [toSugg, setToSugg] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const fromRef = useRef(null);
  const toRef   = useRef(null);

  const suggest = (val, setter) => {
    if (!val) { setter([]); return; }
    setter(CITIES.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 5));
  };

  const filtered = rides.filter(r => {
    if (activeFilter === "AC" && !r.ac) return false;
    if (activeFilter === "Ladies-only" && !r.ladies) return false;
    if (activeFilter === "No Smoking" && !r.noSmoking) return false;
    if (activeFilter === "Pets Allowed" && !r.pets) return false;
    if (activeFilter === "Verified" && !r.verified) return false;
    if (from && !r.from.toLowerCase().includes(from.toLowerCase())) return false;
    if (to   && !r.to.toLowerCase().includes(to.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/rides/search?fromLat=17.44&fromLng=78.38&minSeats=${guests}`);
        const formatted = (res.data || []).map(r => {
            const d = new Date(r.departureTime);
            return {
                id: r._id,
                from: r.from?.address?.split(',')[0] || "Unknown",
                to: r.to?.address?.split(',')[0] || "Unknown",
                date: d.toLocaleDateString(),
                time: d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                driver: `${r.driver?.firstName} ${r.driver?.lastName}`,
                rating: r.driver?.overallRating || 0,
                reviews: r.driver?.totalRatings || 0,
                price: r.pricePerSeat,
                seats: r.availableSeats,
                car: `${r.vehicle?.brand || ""} ${r.vehicle?.model || ""}`,
                ac: r.preferences?.some(p=>p.toLowerCase().includes('ac')) || true,
                ladies: r.preferences?.some(p=>p.toLowerCase().includes('women')) || false,
                noSmoking: r.preferences?.some(p=>p.toLowerCase().includes('no smoke')) || true,
                pets: r.preferences?.some(p=>p.toLowerCase().includes('pet')) || false,
                verified: true
            };
        });
        setRides(formatted);
      } catch (err) {
        console.error("Failed to fetch rides", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();

    const close = (e) => {
      if (!fromRef.current?.contains(e.target)) setFromSugg([]);
      if (!toRef.current?.contains(e.target))   setToSugg([]);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [guests]);

  return (
    <AppShell title="Find a Ride" role="passenger" unreadCount={2}>
      {/* Hero search bar */}
      <div className="search-hero">
        <div className="search-hero-title">Find your <em>perfect</em> ride</div>
        <div className="search-hero-sub">Search from thousands of shared rides across the city</div>
        <div className="search-form">
          {/* FROM */}
          <div className="autocomplete-wrap" ref={fromRef}>
            <input
              className="search-input"
              placeholder="🚏 From city or area"
              value={from}
              onChange={e => { setFrom(e.target.value); suggest(e.target.value, setFromSugg); }}
            />
            {fromSugg.length > 0 && (
              <div className="autocomplete-list">
                {fromSugg.map(s => (
                  <div key={s} className="ac-item" onClick={() => { setFrom(s); setFromSugg([]); }}>
                    📍 {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TO */}
          <div className="autocomplete-wrap" ref={toRef}>
            <input
              className="search-input"
              placeholder="🎯 To city or area"
              value={to}
              onChange={e => { setTo(e.target.value); suggest(e.target.value, setToSugg); }}
            />
            {toSugg.length > 0 && (
              <div className="autocomplete-list">
                {toSugg.map(s => (
                  <div key={s} className="ac-item" onClick={() => { setTo(s); setToSugg([]); }}>
                    📍 {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            type="date"
            className="search-input-dark"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ colorScheme: "dark" }}
          />

          <select
            className="search-input-dark"
            value={guests}
            onChange={e => setGuests(e.target.value)}
          >
            {[1,2,3,4].map(n => <option key={n} value={n}>{n} seat{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <span style={{ fontSize: "0.78rem", color: "var(--mist)", fontWeight: 600, marginRight: 4 }}>Filter:</span>
        {FILTERS.map(f => (
          <button key={f} className={`filter-chip ${activeFilter === f ? "active" : ""}`} onClick={() => setActiveFilter(f)}>
            {f}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--mist)" }}>
          {filtered.length} ride{filtered.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* Results */}
      <div>
        {loading ? (
           <div className="info-card" style={{ textAlign: "center", padding: "60px 24px" }}>
             <span className="auth-spinner" style={{display: 'inline-block', marginBottom: 16}} />
             <div className="info-card-title">Searching rides...</div>
           </div>
        ) : filtered.length === 0 ? (
          <div className="info-card" style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
            <div className="info-card-title" style={{ marginBottom: 8 }}>No rides found</div>
            <p style={{ color: "var(--mist)", fontSize: "0.9rem" }}>Try adjusting your filters or pick a different date.</p>
          </div>
        ) : (
          filtered.map(ride => (
            <div key={ride.id} className="ride-card" onClick={() => navigate(`/rides/${ride.id}`)}>
              <div className="ride-card-top">
                <div className="rc-avatar">{ride.driver[0]}</div>
                <div className="rc-driver">
                  <div className="rc-driver-name">{ride.driver}</div>
                  <div className="rc-rating"><span>★ {ride.rating}</span> · {ride.reviews} reviews · {ride.car}</div>
                </div>
                <div className="rc-price">
                  <div className="rc-price-amt">₹{ride.price}</div>
                  <div className="rc-price-label">per seat</div>
                </div>
              </div>

              <div className="ride-card-route">
                <div className="rc-city">{ride.from}</div>
                <div className="rc-arrow">→</div>
                <div className="rc-city">{ride.to}</div>
                <div className="rc-time">{ride.date} · {ride.time}</div>
              </div>

              <div className="ride-card-meta">
                <div className="rc-meta-pill"><span>💺</span> {ride.seats} seat{ride.seats !== 1 ? "s" : ""} left</div>
                {ride.ac        && <div className="rc-meta-pill"><span>❄️</span> AC</div>}
                {ride.noSmoking && <div className="rc-meta-pill"><span>🚭</span> No Smoke</div>}
                {ride.pets      && <div className="rc-meta-pill"><span>🐾</span> Pets</div>}
                {ride.ladies    && <div className="rc-meta-pill"><span>👩</span> Ladies-only</div>}
                {ride.verified  && <div className="rc-meta-pill"><span>✅</span> Verified</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
