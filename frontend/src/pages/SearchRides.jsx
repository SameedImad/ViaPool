import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  MapPin, 
  Target, 
  Calendar, 
  Users, 
  Search as SearchIcon, 
  Wind, 
  UserCircle, 
  ShieldCheck, 
  Car
} from "lucide-react";
import api from "../lib/api";
import { logger } from "../lib/logger";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Auth.css";
import "../pages/Passenger.css";

const FILTERS = ["All", "AC", "Ladies-only", "No Smoking", "Pets Allowed", "Verified"];

function preferenceList(preferences = {}) {
  if (Array.isArray(preferences)) return preferences;

  const list = [];
  if (preferences.allowPets) list.push("Pets welcome");
  if (preferences.preferredGender === "female") list.push("Women only");
  if (preferences.preferredGender === "male") list.push("Men only");
  return list;
}

export default function SearchRides() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const fromSuggestTimeoutRef = useRef(null);
  const toSuggestTimeoutRef = useRef(null);

  const activeRole = localStorage.getItem("via-role") || "passenger";

  const fetchSuggestions = async (val, setter) => {
    const normalized = val.trim();
    if (normalized.length < 2) {
      setter([]);
      return;
    }

    try {
      const query = /india/i.test(normalized) ? normalized : `${normalized}, India`;
      const res = await api.get(`/api/v1/maps/autocomplete?input=${encodeURIComponent(query)}`);
      const nextSuggestions = (res?.data || [])
        .map((item) => item.description)
        .filter(Boolean)
        .slice(0, 5);
      setter(nextSuggestions);
    } catch (err) {
      logger.error("Failed to fetch location suggestions", err);
      setter([]);
    }
  };

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        minSeats: guests,
        fromAddress: from,
        toAddress: to,
        date: date
      });
      
      const res = await api.get(`/api/v1/rides/search?${params.toString()}`);
      
      const rawRides = res.data || [];
      const formatted = rawRides.map(r => {
          const d = new Date(r.departureTime);
          const prefs = preferenceList(r.preferences);
          return {
              id: r._id,
              from: r.from?.address?.split(',')[0] || "Unknown",
              to: r.to?.address?.split(',')[0] || "Unknown",
              date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
              time: d.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }),
              driver: `${r.driver?.firstName} ${r.driver?.lastName}`,
              driverPhoto: r.driver?.profilePhoto,
              rating: r.driver?.overallRating || 0,
              reviews: r.driver?.totalRatings || 0,
              price: r.pricePerSeat,
              seats: r.availableSeats,
              car: `${r.vehicle?.brand || ""} ${r.vehicle?.model || ""}`,
              ac: prefs.some(p => p.toLowerCase().includes('ac')),
              ladies: prefs.some(p => p.toLowerCase().includes('lady') || p.toLowerCase().includes('women')),
              noSmoking: prefs.some(p => p.toLowerCase().includes('no smoke')),
              pets: prefs.some(p => p.toLowerCase().includes('pet')),
              verified: r.driver?.isVerified || false
          };
      });
      setRides(formatted);
    } catch (err) {
      logger.error("Failed to fetch rides", err);
    } finally {
      setLoading(false);
    }
  }, [date, from, guests, to]);

  useEffect(() => {
    fetchRides();
    
    const close = (e) => {
      if (!fromRef.current?.contains(e.target)) setFromSugg([]);
      if (!toRef.current?.contains(e.target))   setToSugg([]);
    };
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      if (fromSuggestTimeoutRef.current) clearTimeout(fromSuggestTimeoutRef.current);
      if (toSuggestTimeoutRef.current) clearTimeout(toSuggestTimeoutRef.current);
    };
  }, [fetchRides, location.key]);

  const filtered = rides.filter(r => {
    if (activeFilter === "AC" && !r.ac) return false;
    if (activeFilter === "Ladies-only" && !r.ladies) return false;
    if (activeFilter === "No Smoking" && !r.noSmoking) return false;
    if (activeFilter === "Pets Allowed" && !r.pets) return false;
    if (activeFilter === "Verified" && !r.verified) return false;
    return true;
  });

  return (
    <AppShell title="Find a Ride" role={activeRole} unreadCount={2}>
      {/* Hero search bar */}
      <div className="search-hero">
        <div className="search-hero-title">Find your <em>perfect</em> ride</div>
        <div className="search-hero-sub">Enter your destination and travel with verified members</div>
        
        <div className="search-form-premium">
          <div className="sf-input-group" ref={fromRef}>
            <span className="sf-icon"><MapPin size={18} /></span>
            <input
              className="sf-input"
              placeholder="From city..."
              value={from}
              onChange={(e) => {
                const next = e.target.value;
                setFrom(next);
                if (fromSuggestTimeoutRef.current) clearTimeout(fromSuggestTimeoutRef.current);
                fromSuggestTimeoutRef.current = setTimeout(() => {
                  fetchSuggestions(next, setFromSugg);
                }, 250);
              }}
            />
            {fromSugg.length > 0 && (
              <div className="sf-dropdown">
                {fromSugg.map(s => (
                  <div key={s} className="sf-dropdown-item" onClick={() => { setFrom(s); setFromSugg([]); }}>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sf-input-group" ref={toRef}>
            <span className="sf-icon"><Target size={18} /></span>
            <input
              className="sf-input"
              placeholder="To city..."
              value={to}
              onChange={(e) => {
                const next = e.target.value;
                setTo(next);
                if (toSuggestTimeoutRef.current) clearTimeout(toSuggestTimeoutRef.current);
                toSuggestTimeoutRef.current = setTimeout(() => {
                  fetchSuggestions(next, setToSugg);
                }, 250);
              }}
            />
            {toSugg.length > 0 && (
              <div className="sf-dropdown">
                {toSugg.map(s => (
                  <div key={s} className="sf-dropdown-item" onClick={() => { setTo(s); setToSugg([]); }}>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sf-input-group">
            <span className="sf-icon"><Calendar size={18} /></span>
            <input
              type="date"
              className="sf-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="sf-input-group">
            <span className="sf-icon"><Users size={18} /></span>
            <select
              className="sf-input"
              value={guests}
              onChange={e => setGuests(e.target.value)}
            >
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <button className="sf-search-btn" onClick={fetchRides}>
            <SearchIcon size={16} />
            SEARCH
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        {FILTERS.map(f => (
          <button 
            key={f} 
            className={`filter-chip ${activeFilter === f ? "active" : ""}`} 
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--mist)" }}>
          {filtered.length} ride{filtered.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* Results */}
      <div className="search-results-grid">
        {loading ? (
           <div className="info-card" style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 24px" }}>
             <span className="auth-spinner" style={{display: 'inline-block', marginBottom: 16}} />
             <div className="info-card-title">Looking for available rides...</div>
           </div>
        ) : filtered.length === 0 ? (
          <div className="info-card" style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 24px" }}>
            <div style={{ marginBottom: 20, color: 'var(--mist)' }}><Car size={64} strokeWidth={1} /></div>
            <div className="info-card-title" style={{ marginBottom: 12 }}>No rides available</div>
            <p style={{ color: "var(--mist)", fontSize: "0.95rem", maxWidth: 400, margin: "0 auto" }}>
              We couldn't find any rides matching your criteria. Try expanding your search or check again later.
            </p>
          </div>
        ) : (
          filtered.map(ride => (
            <div key={ride.id} className="ride-card-modern" onClick={() => navigate(`/rides/${ride.id}`)}>
              <div className="rc-main">
                <div className="rc-time-block">
                    <div className="rc-departure">{ride.time}</div>
                    <div className="rc-date">{ride.date}</div>
                </div>
                
                <div className="rc-route-block">
                  <div className="rc-point">
                    <span className="dot from"></span>
                    <span className="addr">{ride.from}</span>
                  </div>
                  <div className="rc-line-vert"></div>
                  <div className="rc-point">
                    <span className="dot to"></span>
                    <span className="addr">{ride.to}</span>
                  </div>
                </div>

                <div className="rc-price-block">
                  <div className="rc-price-tag">₹{ride.price}</div>
                  <div className="rc-price-label">per seat</div>
                </div>
              </div>

              <div className="rc-footer">
                <div className="rc-driver-pill">
                  {ride.driverPhoto ? (
                      <img src={ride.driverPhoto} alt={ride.driver} className="rc-av-img" />
                  ) : (
                    <div className="rc-av-letter">{ride.driver[0]}</div>
                  )}
                  <div className="rc-driver-meta">
                    <div className="rc-name">{ride.driver} {ride.verified && <ShieldCheck size={14} color="#3b82f6" fill="#3b82f644" />}</div>
                    <div className="rc-stats">★ {ride.rating} · {ride.reviews} reviews</div>
                  </div>
                </div>
                
                <div className="rc-badges">
                   {ride.ac && <span title="AC" className="badge-icon"><Wind size={18} /></span>}
                   {ride.ladies && <span title="Ladies Only" className="badge-icon"><UserCircle size={18} /></span>}
                   {ride.verified && <span title="Verified" className="badge-icon"><ShieldCheck size={18} /></span>}
                   <div className="ride-car-name">{ride.car}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
