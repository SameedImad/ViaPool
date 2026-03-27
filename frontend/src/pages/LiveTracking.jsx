import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Clock, MessageCircle, Phone, Check, AlertTriangle, ArrowLeft } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import LeafletMap from "../components/LeafletMap";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

const STOPS  = [
  { id: "scheduled", label: "Scheduled",   done: true  },
  { id: "ongoing",   label: "En Route",    done: false },
  { id: "completed", label: "Destination", done: false },
];

export default function LiveTracking() {
  const { rideId }    = useParams();
  const navigate      = useNavigate();
  const [etaMins, setEtaMins] = useState(12);
  const [ride, setRide]       = useState(null);
  const [coords, setCoords]   = useState({ lat: 17.4483, lng: 78.3915 });
  const [status, setStatus]   = useState("scheduled");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/api/v1/rides/${rideId}`);
        const r = res.data;
        setRide(r);
        setStatus(r.status);
      } catch (err) {
        console.error("Failed to fetch ride", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRide();

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      withCredentials: true,
      extraHeaders: {
          Authorization: `Bearer ${localStorage.getItem("via-token")}`
      }
    });

    socket.on("connect", () => {
      socket.emit("join-ride-room", rideId);
    });

    socket.on("driver-location", (data) => {
      setCoords({ lat: data.lat, lng: data.lng });
    });

    socket.on("ride-status-update", (data) => {
       if (data.rideId === rideId) {
          setStatus(data.status);
       }
    });

    return () => socket.disconnect();
  }, [rideId]);

  const handleSOS = async () => {
    if (!window.confirm("Trigger Emergency SOS? authorities and admin will be notified.")) return;
    try {
      await api.post("/api/v1/sos/trigger", { 
        rideId, 
        lat: coords.lat, 
        lng: coords.lng, 
        message: "Passenger triggered emergency SOS" 
      });
      alert("SOS Alert Sent! Help is on the way.");
    } catch (err) {
      alert("Failed to send SOS: " + err.message);
    }
  };

  useEffect(() => {
    if (status !== "ongoing") return;
    const t = setInterval(() => setEtaMins(m => Math.max(0, m - 1)), 60000);
    return () => clearInterval(t);
  }, [status]);

  if (loading) return <AppShell title="Loading..." role="passenger"><div className="auth-spinner" style={{margin: "40px auto"}}></div></AppShell>;

  return (
    <AppShell title="Live Tracking" role="passenger" unreadCount={2}>
      <div className="page-header">
        <div className="page-header-eyebrow">Live · Updating real-time</div>
        <h1 className="page-header-title">Track <em>Your Ride</em></h1>
      </div>

      {/* Map */}
      <div className="track-map" style={{ height: 400, borderRadius: 24, overflow: "hidden", position: "relative", zIndex: 1 }}>
        <LeafletMap 
          center={coords} 
          markerCoords={coords} 
          zoom={15} 
        />
        <div className="track-eta-banner" style={{ zIndex: 1000 }}>
          <Clock size={14} /> {status === "completed" ? "Arrived" : `ETA ${etaMins} mins`} · {status === "ongoing" ? "Active" : "Scheduled"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Driver card + journey progress */}
        <div>
          {/* Driver */}
          <div className="driver-location-card">
            <div className="dlc-av">{ride?.driver?.firstName?.[0] || "?"}</div>
            <div className="dlc-info">
              <div className="dlc-name">{ride?.driver?.firstName} {ride?.driver?.lastName}</div>
              <div className="dlc-status">
                <span className="live-dot" style={{ background: status === "ongoing" ? "var(--forest)" : "var(--mist)" }} />
                {status === "ongoing" ? "Moving" : status.charAt(0).toUpperCase() + status.slice(1)} · {ride?.vehicle?.brand} {ride?.vehicle?.model}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-outline" style={{ padding: "8px 14px", display: 'flex', alignItems: 'center' }} onClick={() => navigate(`/rides/${rideId}/chat/${ride?.driver?._id}`)}>
                <MessageCircle size={18} />
              </button>
              <a href={`tel:${ride?.driver?.phone || '+919876543210'}`} style={{ textDecoration: "none" }}>
                <button className="btn-fill" style={{ padding: "8px 14px", background: "var(--forest)", display: 'flex', alignItems: 'center' }}><Phone size={18} /></button>
              </a>
            </div>
          </div>

          {/* Journey steps */}
          <div className="info-card">
            <div className="info-card-title">Journey Progress</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {STOPS.map((s, i) => {
                const isDone = s.id === "scheduled" || (s.id === "ongoing" && (status === "ongoing" || status === "completed")) || (s.id === "completed" && status === "completed");
                const isActive = s.id === status;
                
                return (
                <div key={s.id} style={{ display: "flex", alignItems: "flex-start", gap: 16, paddingBottom: i < STOPS.length - 1 ? 20 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: isDone ? "var(--forest)" : isActive ? "rgba(196,98,45,0.15)" : "var(--sand)",
                      border: isActive ? "2px solid var(--terracotta)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", color: isDone ? "#fff" : "var(--mist)",
                      flexShrink: 0,
                    }}>
                      {isDone ? <Check size={14} /> : i + 1}
                    </div>
                    {i < STOPS.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 20, background: isDone ? "var(--forest)" : "var(--sand)", marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--ink)", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: "0.75rem", color: isDone ? "var(--forest)" : "var(--mist)" }}>
                      {isDone ? "Completed" : isActive ? "In progress…" : "Upcoming"}
                    </div>
                  </div>
                </div>
              );})}
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
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--terracotta)", marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={16} /> Emergency
            </div>
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
              onClick={handleSOS}
            >
              Send SOS Alert
            </button>
          </div>

          <button className="btn-outline" style={{ width: "100%", marginTop: 14 }} onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back to Booking
          </button>
        </div>
      </div>
    </AppShell>
  );
}
