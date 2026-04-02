import { useState, useEffect } from "react";
import { AlertTriangle, CarFront, Plus, PlusCircle } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Auth.css";
import "../pages/Driver.css";

function AddVehicleModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ make: "", model: "", year: "", plate: "", type: "Sedan", color: "" });
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));
  const isValid = form.make && form.model && form.plate;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "var(--cream)", borderRadius: 20, padding: 32, maxWidth: 460, width: "100%" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--ink)", marginBottom: 20 }}>Add a Vehicle</h2>
        <div className="auth-form" style={{ gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[{ label: "Brand", key: "make", ph: "Honda" }, { label: "Model", key: "model", ph: "City" }].map((f) => (
              <div className="auth-field" key={f.key}>
                <label className="auth-label">{f.label}</label>
                <input className="auth-input" placeholder={f.ph} value={form[f.key]} onChange={set(f.key)} />
              </div>
            ))}
            <div className="auth-field">
              <label className="auth-label">Year</label>
              <input className="auth-input" placeholder="2022" value={form.year} onChange={set("year")} />
            </div>
            <div className="auth-field">
              <label className="auth-label">Type</label>
              <select className="auth-input" value={form.type} onChange={set("type")} style={{ cursor: "pointer" }}>
                {["Sedan", "SUV", "Hatchback", "MUV", "Electric"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-label">Registration plate</label>
            <input className="auth-input" placeholder="TS 09 AB 1234" value={form.plate} onChange={(e) => setForm((p) => ({ ...p, plate: e.target.value.toUpperCase() }))} style={{ fontFamily: "var(--font-mono)", letterSpacing: 2 }} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Color</label>
            <input className="auth-input" placeholder="White" value={form.color} onChange={set("color")} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="auth-submit" disabled={!isValid} style={{ flex: 1, margin: 0 }} onClick={() => { onAdd(form); onClose(); }}>
            Add Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/api/v1/vehicles");
      const formatted = (res.data || []).map((v) => ({
        id: v._id,
        make: v.brand,
        model: v.model,
        year: v.year,
        plate: v.registrationNumber,
        type: v.totalSeats > 4 ? "SUV" : "Sedan",
        color: v.color,
        primary: v.isDefault,
      }));
      setVehicles(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAdd = async (form) => {
    try {
      await api.post("/api/v1/vehicles", form);
      await fetchVehicles();
    } catch (err) {
      alert("Error adding vehicle: " + (err?.response?.data?.message || err.message));
    }
  };

  const setPrimary = async (id) => {
    try {
      await api.patch(`/api/v1/vehicles/${id}/primary`);
      await fetchVehicles();
    } catch (err) {
      alert("Error setting primary: " + err.message);
    }
  };

  const deleteVehicle = async (id) => {
    try {
      await api.delete(`/api/v1/vehicles/${id}`);
      await fetchVehicles();
    } catch (err) {
      alert("Error deleting vehicle: " + err.message);
    }
  };

  return (
    <AppShell title="My Vehicles" role="driver" unreadCount={3}>
      <div className="page-header">
        <div className="page-header-eyebrow">Driver</div>
        <h1 className="page-header-title">My <em>Vehicles</em></h1>
        <p className="page-header-sub">Manage your registered vehicles. Passengers see these details when booking.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {vehicles.map((v) => (
          <div className={`vehicle-card ${v.primary ? "primary-vehicle" : ""}`} key={v.id}>
            {v.primary && <div className="vc-primary-badge">Primary</div>}
            <div className="vc-icon"><CarFront size={36} /></div>
            <div className="vc-make">{v.make} {v.model}</div>
            <div className="vc-plate">{v.plate}</div>
            <div className="vc-meta">
              <div className="vc-meta-item"><strong>{v.type}</strong>Type</div>
              <div className="vc-meta-item"><strong>{v.year}</strong>Year</div>
              <div className="vc-meta-item"><strong>{v.color || "-"}</strong>Color</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              {!v.primary && <button className="btn-outline" style={{ flex: 1, fontSize: "0.8rem", padding: "8px" }} onClick={() => setPrimary(v.id)}>Set as primary</button>}
              <button style={{ flex: v.primary ? 2 : 1, padding: "8px", borderRadius: 10, border: "1.5px solid rgba(196,98,45,0.25)", background: "transparent", fontSize: "0.8rem", color: "var(--terracotta)", cursor: "pointer" }} onClick={() => setDeleting(v.id)}>Remove</button>
            </div>
          </div>
        ))}

        <div className="vehicle-add-card" onClick={() => setShowAdd(true)}>
          <div style={{ color: "var(--terracotta)" }}><PlusCircle size={40} /></div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>Add a vehicle</div>
          <div style={{ fontSize: "0.8rem", color: "var(--mist)", textAlign: "center" }}>Register another car for your rides</div>
        </div>
      </div>

      {showAdd && <AddVehicleModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}

      {deleting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--cream)", borderRadius: 20, padding: 32, maxWidth: 380, width: "100%", textAlign: "center" }}>
            <div style={{ marginBottom: 16, color: "var(--terracotta)" }}><AlertTriangle size={40} /></div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--ink)", marginBottom: 8 }}>Remove vehicle?</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--mist)", lineHeight: 1.6, marginBottom: 24 }}>This vehicle will be removed from your profile. Any active rides using it will not be affected.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setDeleting(null)}>Cancel</button>
              <button style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "var(--terracotta)", color: "#fff", fontFamily: "var(--font-sans)", fontWeight: 700, cursor: "pointer" }} onClick={() => { deleteVehicle(deleting); setDeleting(null); }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
