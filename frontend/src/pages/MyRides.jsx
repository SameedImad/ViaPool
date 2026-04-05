import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Car, CheckCircle, Clock, MapPin, Plus } from "lucide-react";
import AppShell from "../components/AppShell";
import api from "../lib/api";
import { logger } from "../lib/logger";
import "../pages/AppShell.css";
import "../pages/Auth.css";
import "../pages/Driver.css";

const STATUS_MAP = {
  ongoing: { cls: "badge-verified", text: "Active", icon: CheckCircle },
  scheduled: { cls: "badge-pending", text: "Scheduled", icon: Clock },
  completed: { cls: "badge-verified", text: "Completed", icon: CheckCircle },
  cancelled: { cls: "badge-rejected", text: "Cancelled", icon: Clock },
};

export default function MyRides() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await api.get("/api/v1/rides/driver/dashboard");
        setRides(res.data?.upcomingRides || []);
      } catch (err) {
        logger.error("Failed to fetch driver rides", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  return (
    <AppShell title="My Rides" role="driver">
      <div className="page-header">
        <div className="page-header-eyebrow">Driver</div>
        <h1 className="page-header-title">My <em>Rides</em></h1>
      </div>

      <div className="layout-top-actions" style={{ marginBottom: 20 }}>
        <p style={{ margin: 0, color: "var(--mist)", fontSize: "0.92rem" }}>
          View and manage your scheduled and active rides.
        </p>
        <button
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
          onClick={() => navigate("/driver/rides/create")}
        >
          <Plus size={16} /> Post a Ride
        </button>
      </div>

      {loading ? (
        <div className="auth-spinner" style={{ margin: "60px auto" }} />
      ) : rides.length === 0 ? (
        <div className="info-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ color: "var(--mist)", marginBottom: 16 }}>
            <Car size={48} strokeWidth={1} />
          </div>
          <p style={{ color: "var(--mist)", fontSize: "0.92rem", marginBottom: 18 }}>
            No rides yet. Post your first ride to start receiving bookings.
          </p>
          <button className="btn-primary" onClick={() => navigate("/driver/rides/create")}>
            Post a Ride <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {rides.map((ride) => {
            const statusMeta = STATUS_MAP[ride.status] || STATUS_MAP.scheduled;
            const departure = new Date(ride.departureTime);

            return (
              <div
                key={ride._id}
                className="dash-ride-card driver-ride-list-card"
                onClick={() => navigate(`/driver/rides/${ride._id}`)}
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background: "var(--cream)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={22} color="var(--terracotta)" />
                </div>

                <div className="driver-ride-list-meta">
                  <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "1rem", marginBottom: 4 }}>
                    {ride.from?.address?.split(",")[0]} to {ride.to?.address?.split(",")[0]}
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--mist)" }}>
                    {departure.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at{" "}
                    {departure.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
                    {ride.passengersCount || 0}/{Math.max(0, (ride.totalSeats || 1) - 1)} passengers
                  </div>
                </div>

                <span className={`badge ${statusMeta.cls}`}>
                  <statusMeta.icon size={12} style={{ marginRight: 4 }} /> {statusMeta.text}
                </span>

                <div className="driver-ride-list-price">
                  <div style={{ fontWeight: 800, color: "var(--forest)", fontSize: "1.2rem" }}>
                    Rs.{ride.pricePerSeat || 0}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--mist)" }}>per seat</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
