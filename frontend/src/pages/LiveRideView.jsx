import { io } from "socket.io-client";
import api from "../lib/api";

export default function LiveRideView() {
  const { rideId } = useParams();
  const navigate   = useNavigate();
  const [elapsed, setElapsed] = useState(0);   // seconds
  const [speed, setSpeed]     = useState(42);  // simulated km/h
  const [ended, setEnded]     = useState(false);
  const [ride, setRide]       = useState(null);
  const [socket, setSocket]   = useState(null);

  // Simulate live stats ticking
  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/api/v1/rides/${rideId}`);
        setRide(res.data.data);
      } catch (err) {
        console.error("Failed to fetch ride", err);
      }
    };
    fetchRide();

    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      withCredentials: true,
      extraHeaders: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });

    newSocket.on("connect", () => {
      newSocket.emit("join-ride-room", rideId);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [rideId]);

  useEffect(() => {
    if (ended || !socket) return;
    const id = setInterval(() => {
      setElapsed(s => s + 1);
      const newSpeed = Math.floor(32 + Math.random() * 28);
      setSpeed(newSpeed);

      // Simulated location update (Hitech City area roughly)
      const lat = 17.4483 + (Math.random() - 0.5) * 0.01;
      const lng = 78.3915 + (Math.random() - 0.5) * 0.01;
      socket.emit("location-update", { rideId, lat, lng });

    }, 3000);
    return () => clearInterval(id);
  }, [ended, socket, rideId]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const TRIP = { from: "Hitech City", to: "Banjara Hills", dist: 9.4, passengers: 2, totalFare: 480 };

  const handleSOS = async () => {
    if (!window.confirm("Trigger Emergency SOS? authorities and admin will be notified.")) return;
    try {
      if (socket) {
        const coords = { lat: 17.4483, lng: 78.3915 }; // Use current if available
        await api.post("/api/v1/sos/trigger", { 
          rideId, 
          ...coords, 
          message: "Driver triggered emergency SOS" 
        });
        alert("SOS Alert Sent! Help is on the way.");
      }
    } catch (err) {
      alert("Failed to send SOS: " + err.message);
    }
  };

  const handleEnd = async () => {
    try {
      await api.patch(`/api/v1/rides/${rideId}/status`, { status: "completed" });
      setEnded(true);
    } catch (err) {
      alert("Failed to complete ride: " + err.message);
    }
  };

  return (
    <AppShell title="Live Ride" role="driver" unreadCount={3}>
      <div className="page-header">
        <div className="page-header-eyebrow" style={{ color: ended ? "var(--forest)" : "var(--terracotta)" }}>
          {ended ? "✓ Ride Completed" : "● Live"}
        </div>
        <h1 className="page-header-title">
           {ride?.from?.address?.split(',')[0] || "..."} → <em>{ride?.to?.address?.split(',')[0] || "..."}</em>
        </h1>
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
                { label: "Vehicle",    val: `${ride?.vehicle?.brand || "..."}` },
                { label: "Seats",      val: `${ride?.totalSeats || 0} 👤` },
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
            <div style={{ fontSize: "0.78rem", color: "var(--mist)", marginBottom: 4 }}>Price per Seat</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "2.4rem", color: "var(--ink)", letterSpacing: "-0.03em" }}>
              ₹{ride?.pricePerSeat || 0}
            </div>
          </div>

          {/* SOS */}
          <button 
            onClick={handleSOS}
            style={{
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
