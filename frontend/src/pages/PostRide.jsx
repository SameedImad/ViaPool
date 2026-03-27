import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  Users, 
  User, 
  UserCircle, 
  PawPrint, 
  CheckCircle, 
  XCircle,
  Calendar,
  Clock,
  CircleDollarSign,
  Briefcase,
  ChevronRight
} from "lucide-react";
import AppShell from "../components/AppShell";
import api from "../lib/api";
import "../pages/AppShell.css";
import "../pages/Auth.css";
import "../pages/Driver.css";

const SUGGESTIONS = {
  from: ["Hitech City Metro, Hyderabad", "Gachibowli, Hyderabad", "Kondapur, Hyderabad", "KPHB Colony, Hyderabad", "Kukatpally, Hyderabad"],
  to:   ["Banjara Hills, Hyderabad", "Secunderabad Railway Station", "Ameerpet Metro, Hyderabad", "SR Nagar, Hyderabad", "Begumpet, Hyderabad"],
};

function AutocompleteInput({ label, id, value, onChange, suggestions, placeholder }) {
  const [open, setOpen] = useState(false);
  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && value.length > 0);

  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={id}>{label}</label>
      <div className="autocomplete-wrap">
        <input
          id={id}
          className="auth-input"
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
        {open && filtered.length > 0 && (
          <div className="autocomplete-list">
            {filtered.map(s => (
              <div className="ac-item" key={s} onMouseDown={() => { onChange(s); setOpen(false); }}>
                <MapPin size={14} style={{marginRight: 8, opacity: 0.5}} /> {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostRide() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    from: "", to: "", date: "", time: "", seats: "2", price: "",
    allowPets: false, genderPref: "any", luggage: "small",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const activeRole = localStorage.getItem("via-role") || "driver";

  const set = f => v => setForm(p => ({ ...p, [f]: typeof v === "object" ? v.target.value : v }));

  const validate = () => {
    const e = {};
    if (!form.from)  e.from  = "Required";
    if (!form.to)    e.to    = "Required";
    if (!form.date)  e.date  = "Required";
    if (!form.time)  e.time  = "Required";
    if (!form.price) e.price = "Set a price per seat";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    
    try {
      const departureDate = new Date(`${form.date}T${form.time}:00`);
      
      const payload = {
        from: {
          address: form.from,
          coordinates: [78.38 + Math.random()*0.1, 17.44 + Math.random()*0.1]
        },
        to: {
          address: form.to,
          coordinates: [78.38 + Math.random()*0.1, 17.44 + Math.random()*0.1]
        },
        departureTime: departureDate.toISOString(),
        pricePerSeat: parseInt(form.price),
        preferences: [
           ...(form.allowPets ? ["Pets welcome"] : []),
           ...(form.genderPref !== "any" ? [`${form.genderPref} only`] : []),
           `Luggage: ${form.luggage}`
        ]
      };
      
      if (form.notes) payload.preferences.push(form.notes);

      await api.post("/api/v1/rides/create", payload);
      navigate("/driver/dashboard");
    } catch (err) {
      setErrors({ form: err.message || "Failed to post ride" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Post a Ride" role={activeRole} unreadCount={3}>
      <div className="page-header">
        <div className="page-header-eyebrow">Driver</div>
        <h1 className="page-header-title">Post a <em>Ride</em></h1>
        <p className="page-header-sub">Fill in your route details. Your listing goes live instantly once submitted.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="post-ride-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* ── Left: form ── */}
          <div className="info-card">
            <div className="info-card-title" style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <MapPin size={20} color="var(--terracotta)" />
                Route Details
            </div>
            {errors.form && <div style={{ color: "var(--terracotta)", marginBottom: 12, fontSize: "0.85rem", padding: "8px", background: "rgba(196,98,45,0.1)", borderRadius: 6 }}>{errors.form}</div>}
            <div className="auth-form">
              <AutocompleteInput label="Pickup location" id="from" value={form.from} onChange={set("from")} suggestions={SUGGESTIONS.from} placeholder="Enter starting point" />
              {errors.from && <span className="auth-error">{errors.from}</span>}

              <AutocompleteInput label="Drop-off location" id="to" value={form.to} onChange={set("to")} suggestions={SUGGESTIONS.to} placeholder="Enter destination" />
              {errors.to && <span className="auth-error">{errors.to}</span>}

              {/* Date + Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="date">Date</label>
                  <div style={{position: 'relative'}}>
                      <input id="date" type="date" className={`auth-input ${errors.date ? "error" : ""}`} value={form.date} onChange={set("date")} style={{paddingLeft: 40}} />
                      <Calendar size={16} style={{position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4}} />
                  </div>
                  {errors.date && <span className="auth-error">{errors.date}</span>}
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="time">Departure time</label>
                  <div style={{position: 'relative'}}>
                      <input id="time" type="time" className={`auth-input ${errors.time ? "error" : ""}`} value={form.time} onChange={set("time")} style={{paddingLeft: 40}} />
                      <Clock size={16} style={{position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4}} />
                  </div>
                  {errors.time && <span className="auth-error">{errors.time}</span>}
                </div>
              </div>

              {/* Seats + Price */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="seats">Available seats</label>
                  <div style={{position: 'relative'}}>
                      <select id="seats" className="auth-input" value={form.seats} onChange={set("seats")} style={{ cursor: "pointer", paddingLeft: 40 }}>
                        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} seat{n > 1 ? "s" : ""}</option>)}
                      </select>
                      <Users size={16} style={{position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4}} />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="price">Price per seat (₹)</label>
                  <div style={{position: 'relative'}}>
                      <input id="price" type="number" min="0" className={`auth-input ${errors.price ? "error" : ""}`} placeholder="e.g. 200" value={form.price} onChange={set("price")} style={{paddingLeft: 40}} />
                      <CircleDollarSign size={16} style={{position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4}} />
                  </div>
                  {errors.price && <span className="auth-error">{errors.price}</span>}
                </div>
              </div>

              <div className="info-card-title" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Briefcase size={20} color="var(--terracotta)" />
                  Preferences
              </div>
              {/* Gender */}
              <div className="auth-field">
                <label className="auth-label">Passenger gender preference</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["any", "male", "female"].map(g => (
                    <button type="button" key={g}
                      className={`auth-role-btn ${form.genderPref === g ? "active" : ""}`}
                      style={{ flex: 1, gap: 8 }}
                      onClick={() => setForm(p => ({ ...p, genderPref: g }))}
                    >
                      {g === "any" ? <Users size={14} /> : g === "male" ? <User size={14} /> : <UserCircle size={14} />}
                      {g === "any" ? "Any" : g === "male" ? "Men only" : "Women only"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Luggage / Pets */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="auth-field">
                  <label className="auth-label">Luggage allowed</label>
                  <select className="auth-input" value={form.luggage} onChange={set("luggage")} style={{ cursor: "pointer" }}>
                    <option value="none">No luggage</option>
                    <option value="small">Small bag</option>
                    <option value="medium">Medium bag</option>
                    <option value="large">Large bag</option>
                  </select>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Pets</label>
                  <div className={`auth-role-btn ${form.allowPets ? "active" : ""}`}
                    style={{ cursor: "pointer", justifyContent: "flex-start", gap: 8 }}
                    onClick={() => setForm(p => ({ ...p, allowPets: !p.allowPets }))}>
                    <PawPrint size={16} /> {form.allowPets ? "Pets welcome" : "No pets"}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="notes">Additional notes (optional)</label>
                <textarea id="notes" className="auth-input" rows="3" placeholder="e.g. No eating in the car, AC available…" value={form.notes} onChange={set("notes")} style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>

          {/* ── Right: preview ── */}
          <div>
            <div className="info-card" style={{ position: "sticky", top: 80 }}>
              <div className="info-card-title">Ride Preview</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "From",    val: form.from  || "—" },
                  { label: "To",      val: form.to    || "—" },
                  { label: "Date",    val: form.date  || "—" },
                  { label: "Time",    val: form.time  || "—" },
                  { label: "Seats",   val: form.seats },
                  { label: "Price",   val: form.price ? `₹${form.price}/seat` : "—" },
                  { label: "Pets",    val: form.allowPets ? <><CheckCircle size={14} color="var(--forest)" /> Allowed</> : <><XCircle size={14} color="var(--terracotta)" /> No</> },
                  { label: "Gender",  val: form.genderPref === "any" ? "Any" : form.genderPref === "male" ? "Men only" : "Women only" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid var(--sand)" }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--mist)" }}>{r.label}</span>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", maxWidth: "55%", textAlign: "right", display: 'flex', alignItems: 'center', gap: 6 }}>{r.val}</span>
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
                style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                onClick={handleSubmit}
              >
                {loading ? <><span className="auth-spinner" />Posting…</> : <>Post Ride <ChevronRight size={18} /></>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
