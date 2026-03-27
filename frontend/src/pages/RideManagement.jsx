import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MessageCircle, 
  Car, 
  CheckCircle, 
  Clock, 
  User, 
  Star, 
  MapPin, 
  CircleDollarSign,
  ArrowRight
} from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Driver.css";

const STATUS_STYLE = {
  pending:  { cls: "badge-pending",  label: "Pending", icon: Clock },
  accepted: { cls: "badge-verified", label: "Accepted", icon: CheckCircle },
  rejected: { cls: "badge-rejected", label: "Rejected", icon: CircleDollarSign }, // Using as a generic placeholder if needed
};

export default function RideManagement() {
  const { rideId } = useParams();
  const navigate   = useNavigate();
  const [passengers, setPassengers] = useState([]);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeRole = localStorage.getItem("via-role") || "driver";

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
          paid: b.paymentStatus === "paid" || b.paymentStatus === "success",
          pickedUp: b.status === "picked_up" 
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

  const markPickedUp = async (bookingId) => {
    try {
      await api.patch(`/api/v1/rides/${rideId}/booking/${bookingId}/pickup`);
      setPassengers(ps => ps.map(p => p.id === bookingId ? { ...p, pickedUp: true } : p));
    } catch (err) {
      alert("Failed to mark as picked up: " + err.message);
    }
  };

  const startRide = async () => {
    try {
      await api.patch(`/api/v1/rides/${rideId}/status`, { status: "ongoing" });
      navigate(`/driver/rides/${rideId}/live`);
    } catch (err) {
      alert("Failed to start ride: " + err.message);
    }
  };

  const totalEarnings = passengers.filter(p => p.status === "accepted").reduce((s, p) => s + p.seats * (ride?.fare || 0), 0);

  if (loading) return <AppShell title="Loading..." role={activeRole}><div className="auth-spinner" style={{margin: "40px auto"}}></div></AppShell>;
  if (!ride) return <AppShell title="Not Found" role={activeRole}><div style={{padding: 40}}>Ride details not found</div></AppShell>;

  return (
    <AppShell title="Ride Management" role={activeRole} unreadCount={3}>
      <div className="page-header">
        <div className="page-header-eyebrow">Ride #{rideId.slice(-6).toUpperCase()}</div>
        <h1 className="page-header-title">{ride.from} → <em>{ride.to}</em></h1>
        <p className="page-header-sub">{ride.date} · {ride.time} · {ride.seats} seats</p>
      </div>

      <div className="ride-mgmt-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        {/* ── Passenger list ── */}
        <div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", color: "var(--ink)", marginBottom: 20 }}>
            Passenger Requests ({passengers.length})
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            {passengers.map(p => {
              const S = STATUS_STYLE[p.status];
              return (
                <div className="passenger-row-modern" key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', background: 'var(--parchment)', borderRadius: 16, border: '1px solid var(--sand)' }}>
                  <div className="pr-av" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--terracotta)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginRight: 16 }}>{p.letter}</div>
                  <div className="pr-info" style={{flex: 1}}>
                    <div className="pr-name" style={{fontWeight: 700, color: 'var(--ink)'}}>{p.name}</div>
                    <div className="pr-sub" style={{fontSize: '0.82rem', color: 'var(--mist)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6}}>
                      <Star size={12} fill="var(--ember)" color="var(--ember)" /> {p.rating} · {p.seats} seat{p.seats > 1 ? "s" : ""} · Pickup: {p.pickup}
                    </div>
                  </div>
                  
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <span className={`badge ${S.cls}`} style={{display: 'flex', alignItems: 'center', gap: 4}}>
                        <S.icon size={12} /> {S.label}
                    </span>

                    <button
                      onClick={() => togglePaid(p.id)}
                      style={{
                        padding: "6px 12px", borderRadius: 8, fontSize: "0.76rem", fontWeight: 700,
                        border: p.paid ? "1.5px solid rgba(45,74,53,0.3)" : "1.5px solid var(--sand)",
                        background: p.paid ? "rgba(45,74,53,0.08)" : "transparent",
                        color: p.paid ? "var(--forest)" : "var(--mist)",
                        cursor: "pointer", transition: "all 0.2s",
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                        {p.paid ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {p.paid ? "Paid" : "Unpaid"}
                    </button>

                    <button
                      className="btn-outline"
                      style={{ padding: "8px", borderRadius: 10 }}
                      onClick={() => navigate(`/rides/${rideId}/chat/${p.passengerId}`)}
                    >
                        <MessageCircle size={16} />
                    </button>

                    {p.status === "accepted" && !p.pickedUp && (
                       <button
                         className="btn-primary"
                         style={{ padding: "8px 16px", fontSize: "0.8rem", background: "var(--forest)" }}
                         onClick={() => markPickedUp(p.id)}
                       >Pick Up</button>
                    )}
                    {p.pickedUp && <span style={{ fontSize: "0.8rem", color: "var(--forest)", fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} /> Picked Up</span>}

                    {p.status === "pending" && (
                      <div className="pr-actions" style={{display: 'flex', gap: 8}}>
                        <button className="btn-accept" style={{padding: '8px 16px', borderRadius: 10}} onClick={() => updateStatus(p.id, "accepted")}>Accept</button>
                        <button className="btn-reject" style={{padding: '8px 16px', borderRadius: 10}} onClick={() => updateStatus(p.id, "rejected")}>Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Ride summary ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="info-card">
            <div className="info-card-title">Payment Summary</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                {passengers.filter(p => p.status === "accepted").map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid var(--sand)" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--mist)" }}>{p.name} ({p.seats} seat{p.seats > 1 ? "s" : ""})</span>
                    <span style={{ fontWeight: 700, fontSize: "0.88rem", color: p.paid ? "var(--forest)" : "var(--terracotta)", display: 'flex', alignItems: 'center', gap: 4 }}>
                      ₹{p.seats * ride.fare} {p.paid ? <CheckCircle size={14} /> : <Clock size={14} />}
                    </span>
                  </div>
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTop: '2px solid var(--sand)' }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}>Total</span>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--ink)", fontWeight: 800 }}>₹{totalEarnings}</span>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: '16px', fontSize: '1rem', gap: 10 }}
            onClick={startRide}
          >
            <Car size={20} /> Start Live Ride
          </button>
        </div>
      </div>
    </AppShell>
  );
}
