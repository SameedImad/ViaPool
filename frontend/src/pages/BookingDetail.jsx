import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

export default function BookingDetail() {
  const { bookingId } = useParams();
  const navigate       = useNavigate();
  const location       = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled,  setCancelled]  = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get("/api/v1/bookings/my-bookings");
        const b = res.data.find(x => x._id === bookingId);
        if (b) {
            const d = new Date(b.ride?.departureTime);
            setBooking({
                id: b._id,
                from: b.ride?.from?.address?.split(',')[0] || "Unknown",
                fromTime: d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                to: b.ride?.to?.address?.split(',')[0] || "Unknown",
                toTime: "N/A", // Backend doesn't store arrival time for carpools usually
                date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                seats: b.seatsBooked,
                driver: { 
                    name: b.ride?.driver ? `${b.ride.driver.firstName} ${b.ride.driver.lastName}` : "Unknown",
                    rating: 4.8, 
                    letter: b.ride?.driver?.firstName?.[0] || "D",
                    phone: b.ride?.driver?.phone || "N/A",
                    id: b.ride?.driver?._id
                },
                car: { make: "Vehicle", plate: "Registered" }, // Need to populate vehicle model if available
                subtotal: b.totalPrice, 
                fee: 15, 
                insurance: 10, 
                total: b.totalPrice + 25,
                status: b.bookingStatus === "cancelled" ? "cancelled" : (b.ride?.status === "completed" ? "completed" : "upcoming"),
                paymentMode: "UPI / Online",
                txn: b._id.substring(0, 16),
                rideId: b.ride?._id,
            });
        }
      } catch (err) {
        console.error("Booking load failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, location.key]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(true);
    try {
      await api.patch(`/api/v1/bookings/${bookingId}/cancel`);
      setCancelled(true);
    } catch (err) {
      alert("Cancellation failed: " + err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <AppShell title="Loading..." role="passenger"><div className="auth-spinner" style={{margin: '40px auto'}}/></AppShell>;
  if (!booking) return <AppShell title="Not Found" role="passenger"><div style={{padding: 40, textAlign: 'center'}}>Booking not found</div></AppShell>;

  const b = booking;
  const isCancellable = b.status === "upcoming" && !cancelled;

  return (
    <AppShell title="Booking Detail" role="passenger" unreadCount={2}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <button className="btn-outline" onClick={() => navigate("/passenger/bookings")} style={{ padding: "8px 16px" }}>← Back</button>
        <span className={`badge ${cancelled ? "badge-rejected" : STATUS_BADGE[b.status]}`}>
          {cancelled ? "Cancelled" : b.status}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        {/* Main info */}
        <div>
          {/* Dark hero */}
          <div className="booking-detail-hero">
            <div className="bd-ref">Booking ID · {bookingId || b.id}</div>
            <div className="bd-route">
              <div className="bd-stop">
                <div className="bd-stop-dot from" />
                <div className="bd-stop-city">{b.from}</div>
                <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "rgba(245,240,232,0.4)" }}>{b.fromTime}</span>
              </div>
              <div className="bd-stop-line" style={{ marginLeft: 4 }} />
              <div className="bd-stop">
                <div className="bd-stop-dot to" />
                <div className="bd-stop-city">{b.to}</div>
                <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "rgba(245,240,232,0.4)" }}>{b.toTime}</span>
              </div>
            </div>
            <div className="bd-meta-row">
              {[
                { label: "Date",   val: b.date },
                { label: "Seats",  val: b.seats },
                { label: "Mode",   val: b.paymentMode },
                { label: "TXN ID", val: b.txn.substring(0, 12) + "…" },
              ].map(m => (
                <div className="bd-meta-item" key={m.label}>
                  <strong>{m.val}</strong>
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Driver */}
          <div className="info-card" style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
            <div className="rc-avatar" style={{ width: 52, height: 52, fontSize: "1.2rem" }}>{b.driver.letter}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", marginBottom: 3 }}>{b.driver.name}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--mist)" }}>★ {b.driver.rating} · {b.car.make} · {b.car.plate}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-outline" style={{ padding: "8px 16px" }} onClick={() => navigate(`/rides/${b.rideId}/chat/${b.driver.id}`)}>💬 Chat</button>
              {b.status === "upcoming" && !cancelled && (
                <button className="btn-outline" style={{ padding: "8px 16px" }} onClick={() => navigate(`/rides/${b.rideId}/track`)}>📍 Track</button>
              )}
            </div>
          </div>

          {/* Actions */}
          {isCancellable && (
            <div className="info-card" style={{ borderColor: "rgba(196,98,45,0.3)", background: "rgba(196,98,45,0.03)" }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)", marginBottom: 6 }}>Cancel Booking</div>
              <p style={{ fontSize: "0.82rem", color: "var(--mist)", marginBottom: 14, lineHeight: 1.6 }}>
                Cancel at least 30 minutes before departure for a full refund. Late cancellations may incur a fee.
              </p>
              <button
                className="btn-reject"
                style={{ padding: "11px 22px", borderRadius: 12 }}
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling…" : "Cancel This Booking"}
              </button>
            </div>
          )}

          {cancelled && (
            <div className="info-card" style={{ borderColor: "rgba(45,74,53,0.3)", background: "rgba(45,74,53,0.04)", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 700, color: "var(--forest)", marginBottom: 4 }}>Booking Cancelled</div>
              <p style={{ fontSize: "0.82rem", color: "var(--mist)" }}>Refund will be credited within 5–7 business days.</p>
            </div>
          )}

          {b.status === "completed" && !cancelled && (
            <button className="btn-primary" style={{ padding: "12px 28px" }} onClick={() => navigate(`/rides/${b.rideId}/review`)}>
              ⭐ Leave a Review
            </button>
          )}
        </div>

        {/* Receipt sidebar */}
        <div>
          <div className="info-card" style={{ position: "sticky", top: 88 }}>
            <div className="info-card-title">Receipt</div>
            <div className="fare-row"><span>Subtotal</span><span>₹{b.subtotal}</span></div>
            <div className="fare-row"><span>Convenience fee</span><span>₹{b.fee}</span></div>
            <div className="fare-row"><span>Insurance</span><span>₹{b.insurance}</span></div>
            <div className="fare-row total">
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem" }}>₹{b.total}</span>
            </div>
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(45,74,53,0.06)", borderRadius: 10, fontSize: "0.75rem", color: "var(--mist)", lineHeight: 1.6, border: "1px solid rgba(45,74,53,0.15)" }}>
              Payment via {b.paymentMode} · {b.txn}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
