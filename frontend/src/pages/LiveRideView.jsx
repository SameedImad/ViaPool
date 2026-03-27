import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Driver.css";

export default function LiveRideView() {
  const { rideId } = useParams();
  const navigate   = useNavigate();
  const [elapsed, setElapsed] = useState(0);   // seconds
  const [speed, setSpeed]     = useState(42);  // simulated km/h
  const [ended, setEnded]     = useState(false);

  // Simulate live stats ticking
  useEffect(() => {
    if (ended) return;
    const id = setInterval(() => {
      setElapsed(s => s + 1);
      setSpeed(Math.floor(32 + Math.random() * 28));
    }, 1000);
    return () => clearInterval(id);
  }, [ended]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const TRIP = { from: "Hitech City", to: "Banjara Hills", dist: 9.4, passengers: 2, totalFare: 480 };

  const handleEnd = () => {
    setEnded(true);
    // TODO: emit socket event "ride:end" + POST /api/rides/:rideId/end
  };

  return (
    <AppShell title="Live Ride" role="driver" unreadCount={3}>
      <div className="page-header">
        <div className="page-header-eyebrow" style={{ color: ended ? "var(--forest)" : "var(--terracotta)" }}>
          {ended ? "✓ Ride Completed" : "● Live"}
        </div>
        <h1 className="page-header-title">{TRIP.from} → <em>{TRIP.to}</em></h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
        {/* ── Map placeholder ── */}
        <div className="map-placeholder" style={{ height: 380 }}>
          <div className="map-grid" />
          {/* Route line */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 600 380" preserveAspectRatio="none">
            <path d="M 80 320 Q 200 200 350 150 Q 450 120 530 80" fill="none" stroke="rgba(196,98,45,0.6)" strokeWidth="3" strokeDasharray="8 5" />
            <circle cx="80"  cy="320" r="8" fill="var(--gold)" />
            <circle cx="530" cy="80"  r="8" fill="var(--terracotta)" />
          </svg>
          {!ended ? (
            <>
              <div className="map-pulse">🚗</div>
              <div className="map-label">GPS Broadcasting · Live</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "3rem", zIndex: 2 }}>🏁</div>
              <div className="map-label">Trip Completed</div>
            </>
          )}
        </div>

        {/* ── Live stats ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Timer + Speed */}
          <div className="info-card-dark" style={{ borderRadius: 20, padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>
              {[
                { label: "Elapsed",    val: fmt(elapsed)           },
                { label: "Speed",      val: `${speed} km/h`        },
                { label: "Distance",   val: `${TRIP.dist} km`      },
                { label: "Passengers", val: `${TRIP.passengers} 👥` },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: "0.7rem", color: "rgba(245,240,232,0.4)", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", color: "var(--cream)" }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fare */}
          <div className="info-card">
            <div style={{ fontSize: "0.78rem", color: "var(--mist)", marginBottom: 4 }}>Total Fare</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "2.4rem", color: "var(--ink)", letterSpacing: "-0.03em" }}>
              ₹{TRIP.totalFare}
            </div>
          </div>

          {/* SOS */}
          <button style={{
            padding: "16px", borderRadius: 16, border: "2px solid rgba(196,98,45,0.3)",
            background: "rgba(196,98,45,0.06)", cursor: "pointer", transition: "all 0.2s",
            fontFamily: "var(--font-sans)", fontSize: "0.9rem", fontWeight: 700, color: "var(--terracotta)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            🆘 Emergency SOS
          </button>

          {/* End / Review */}
          {!ended ? (
            <button className="auth-submit" onClick={handleEnd} style={{ background: "var(--forest)", boxShadow: "0 8px 24px rgba(45,74,53,0.3)" }}>
              End Ride ✓
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="btn-primary" onClick={() => navigate(`/driver/dashboard`)}>
                Back to Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
