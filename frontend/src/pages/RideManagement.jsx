import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Driver.css";

// Passengers will be fetched dynamically via API

const STATUS_STYLE = {
  pending:  { cls: "badge-pending",  label: "Pending" },
  accepted: { cls: "badge-verified", label: "Accepted" },
  rejected: { cls: "badge-rejected", label: "Rejected" },
};

export default function RideManagement() {
  const { rideId } = useParams();
  const navigate   = useNavigate();
  const [passengers, setPassengers] = useState([]);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rideRes, passRes] = await Promise.all([
          api.get(`/api/v1/rides/${rideId}`),
          api.get(`/api/v1/bookings/${rideId}/passengers`)
        ]);

        const r = rideRes.data.data;
        const d = new Date(r.departureTime);
        setRide({
          from: r.from?.address?.split(',')[0] || "Unknown",
          to: r.to?.address?.split(',')[0] || "Unknown",
          date: d.toLocaleDateString(),
          time: d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          seats: r.totalSeats,
          fare: r.pricePerSeat
        });

        const formattedPass = (passRes.data.data || []).map(b => ({
          id: b._id,
          passengerId: b.passenger?._id,
          name: `${b.passenger?.firstName} ${b.passenger?.lastName}`,
          letter: b.passenger?.firstName?.[0] || 'U',
          rating: b.passenger?.overallRating || 0,
          seats: b.seatsBooked,
          pickup: b.pickupPoint?.address || "Default",
          status: b.bookingStatus === "confirmed" ? "accepted" : b.bookingStatus,
          paid: b.paymentStatus === "paid" || b.paymentStatus === "success"
        }));
        setPassengers(formattedPass);

      } catch (err) {
        console.error("Failed to load ride management data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [rideId]);

  const updateStatus = (id, status) =>
    setPassengers(ps => ps.map(p => p.id === id ? { ...p, status } : p));
  const togglePaid = (id) =>
    setPassengers(ps => ps.map(p => p.id === id ? { ...p, paid: !p.paid } : p));

  const totalEarnings = passengers.filter(p => p.status === "accepted").reduce((s, p) => s + p.seats * (ride?.fare || 0), 0);

  if (loading) return <AppShell title="Loading..." role="driver"><div className="auth-spinner" style={{margin: "40px auto"}}></div></AppShell>;
  if (!ride) return <AppShell title="Not Found" role="driver"><div style={{padding: 40}}>Ride details not found</div></AppShell>;

  return (
    <AppShell title="Ride Management" role="driver" unreadCount={3}>
      <div className="page-header">
        <div className="page-header-eyebrow">Ride #{rideId}</div>
        <h1 className="page-header-title">{ride.from} → <em>{ride.to}</em></h1>
        <p className="page-header-sub">{ride.date} · {ride.time} · {ride.seats} seats</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
        {/* ── Passenger list ── */}
        <div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--ink)", marginBottom: 16 }}>
            Passenger Requests ({passengers.length})
          </div>
          {passengers.map(p => (
            <div className="passenger-row" key={p.id}>
              <div className="pr-av">{p.letter}</div>
              <div className="pr-info">
                <div className="pr-name">{p.name}</div>
                <div className="pr-sub">
                  ★ {p.rating} · {p.seats} seat{p.seats > 1 ? "s" : ""} · Pickup: {p.pickup}
                </div>
              </div>
              <span className={`badge ${STATUS_STYLE[p.status].cls}`}>{STATUS_STYLE[p.status].label}</span>

              {/* Payment toggle */}
              <button
                onClick={() => togglePaid(p.id)}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: "0.76rem", fontWeight: 700,
                  border: p.paid ? "1.5px solid rgba(45,74,53,0.3)" : "1.5px solid var(--sand)",
                  background: p.paid ? "rgba(45,74,53,0.08)" : "transparent",
                  color: p.paid ? "var(--forest)" : "var(--mist)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >{p.paid ? "✓ Paid" : "Unpaid"}</button>

              <button
                className="btn-outline"
                style={{ padding: "7px 14px", fontSize: "0.8rem" }}
                onClick={() => navigate(`/rides/${rideId}/chat/${p.passengerId}`)}
              >💬</button>

              {/* Accept / Reject normally would go here but system auto-confirms */}
              {p.status === "pending" && (
                <div className="pr-actions">
                  <button className="btn-accept" onClick={() => updateStatus(p.id, "accepted")}>Accept</button>
                  <button className="btn-reject" onClick={() => updateStatus(p.id, "rejected")}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Ride summary ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="info-card">
            <div className="info-card-title">Payment Summary</div>
            {passengers.filter(p => p.status === "accepted").map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid var(--sand)", marginBottom: 10 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--mist)" }}>{p.name} ({p.seats} seat{p.seats > 1 ? "s" : ""})</span>
                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: p.paid ? "var(--forest)" : "var(--terracotta)" }}>
                  ₹{p.seats * ride.fare} {p.paid ? "✓" : "⏳"}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1rem" }}>Total</span>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--ink)" }}>₹{totalEarnings}</span>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => navigate(`/driver/rides/${rideId}/live`)}
          >
            🚗 Start Live Ride
          </button>
        </div>
      </div>
    </AppShell>
  );
}
