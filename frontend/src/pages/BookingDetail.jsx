import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

const BOOKING = {
  id: "bk_a1b2c3",
  from: "Hitech City", fromTime: "08:45 AM",
  to:   "Banjara Hills", toTime:  "09:30 AM",
  date: "27 Mar 2026",
  seats: 2,
  driver: { name: "Arjun Sharma", rating: 4.9, letter: "A", phone: "+91 98765 43210" },
  car: { make: "Swift Dzire", plate: "TS09 AB 1234" },
  subtotal: 480, fee: 15, insurance: 10, total: 505,
  status: "upcoming",
  paymentMode: "UPI (GPay)",
  txn: "TXN_A1B2C3D4E5",
  rideId: "r1",
};

const STATUS_BADGE = {
  upcoming:  "badge-pending",
  completed: "badge-verified",
  cancelled: "badge-rejected",
};

export default function BookingDetail() {
  const { bookingId } = useParams();
  const navigate       = useNavigate();
  const [cancelling, setCancelling] = useState(false);
  const [cancelled,  setCancelled]  = useState(false);

  const handleCancel = () => {
    setCancelling(true);
    setTimeout(() => { setCancelling(false); setCancelled(true); }, 1200);
  };

  const b = BOOKING;
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
              <button className="btn-outline" style={{ padding: "8px 16px" }} onClick={() => navigate(`/rides/${b.rideId}/chat/driver1`)}>💬 Chat</button>
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
