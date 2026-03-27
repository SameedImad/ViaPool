import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

const DRIVER = { name: "Arjun Sharma", rating: 4.9, letter: "A", car: "TS09 AB 1234 · Swift Dzire" };
const STOPS  = [
  { label: "Pickup",      done: true  },
  { label: "En Route",    done: true  },
  { label: "Destination", done: false },
];

export default function LiveTracking() {
  const { rideId }    = useParams();
  const navigate      = useNavigate();
  const [etaMins, setEtaMins] = useState(12);

  useEffect(() => {
    // Simulate ETA countdown
    const t = setInterval(() => setEtaMins(m => Math.max(0, m - 1)), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <AppShell title="Live Tracking" role="passenger" unreadCount={2}>
      <div className="page-header">
        <div className="page-header-eyebrow">Live · Updating every 30s</div>
        <h1 className="page-header-title">Track <em>Your Ride</em></h1>
      </div>

      {/* Map */}
      <div className="track-map">
        <div className="track-grid" />
        <div className="track-road" />
        <div className="track-road v" />
        {/* Moving driver pin */}
        <div className="track-pin" style={{ position: "absolute", left: "42%", top: "38%", transform: "translate(-50%,-50%)" }}>
          🚗
        </div>
        {/* Destination pin */}
        <div style={{ position: "absolute", right: "18%", top: "26%", fontSize: "2rem", zIndex: 3 }}>📍</div>
        <div className="track-eta-banner">
          ⏱ ETA {etaMins} min{etaMins !== 1 ? "s" : ""} · 4.2 km away
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Driver card + journey progress */}
        <div>
          {/* Driver */}
          <div className="driver-location-card">
            <div className="dlc-av">{DRIVER.letter}</div>
            <div className="dlc-info">
              <div className="dlc-name">{DRIVER.name}</div>
              <div className="dlc-status">
                <span className="live-dot" />
                Moving · {DRIVER.car}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-outline" style={{ padding: "8px 14px" }} onClick={() => navigate(`/rides/${rideId}/chat/driver1`)}>
                💬
              </button>
              <a href="tel:+919876543210" style={{ textDecoration: "none" }}>
                <button className="btn-fill" style={{ padding: "8px 14px", background: "var(--forest)" }}>📞</button>
              </a>
            </div>
          </div>

          {/* Journey steps */}
          <div className="info-card">
            <div className="info-card-title">Journey Progress</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {STOPS.map((s, i) => (
                <div key={s.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, paddingBottom: i < STOPS.length - 1 ? 20 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: s.done ? "var(--forest)" : i === STOPS.findIndex(x => !x.done) ? "rgba(196,98,45,0.15)" : "var(--sand)",
                      border: i === STOPS.findIndex(x => !x.done) ? "2px solid var(--terracotta)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", color: s.done ? "#fff" : "var(--mist)",
                      flexShrink: 0,
                    }}>
                      {s.done ? "✓" : i + 1}
                    </div>
                    {i < STOPS.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 20, background: s.done ? "var(--forest)" : "var(--sand)", marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--ink)", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: "0.75rem", color: s.done ? "var(--forest)" : "var(--mist)" }}>
                      {s.done ? "Done" : i === STOPS.findIndex(x => !x.done) ? "In progress…" : "Upcoming"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ETA & SOS sidebar */}
        <div>
          <div className="info-card" style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: "0.78rem", color: "var(--mist)", fontWeight: 600, marginBottom: 8 }}>Estimated Arrival</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {etaMins}
            </div>
            <div style={{ color: "var(--mist)", fontSize: "0.88rem", marginTop: 4 }}>minutes</div>
          </div>

          <div className="info-card" style={{ borderColor: "rgba(196,98,45,0.25)", background: "rgba(196,98,45,0.04)" }}>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--terracotta)", marginBottom: 6 }}>🆘 Emergency</div>
            <p style={{ fontSize: "0.8rem", color: "var(--mist)", marginBottom: 12, lineHeight: 1.6 }}>
              Feeling unsafe? Tap SOS to alert emergency contacts.
            </p>
            <button
              style={{
                width: "100%", padding: "12px", borderRadius: 12, border: "none",
                background: "var(--terracotta)", color: "#fff",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.9rem",
                cursor: "pointer", letterSpacing: "0.02em",
              }}
              onClick={() => alert("SOS alert sent to emergency contacts!")}
            >
              Send SOS Alert
            </button>
          </div>

          <button className="btn-outline" style={{ width: "100%", marginTop: 14 }} onClick={() => navigate(-1)}>
            ← Back to Booking
          </button>
        </div>
      </div>
    </AppShell>
  );
}
