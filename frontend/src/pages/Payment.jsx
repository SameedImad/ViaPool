import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

const METHODS = [
  { id: "upi",  icon: "📲", name: "UPI",           sub: "Google Pay, PhonePe, Paytm & more" },
  { id: "card", icon: "💳", name: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay" },
  { id: "nb",   icon: "🏦", name: "Net Banking",   sub: "All major banks supported" },
  { id: "cod",  icon: "💵", name: "Cash to Driver", sub: "Pay on the day of ride" },
];

export default function Payment() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const [method,  setMethod]  = useState("upi");
  const [upiId,   setUpiId]   = useState("");
  const [loading, setLoading]  = useState(true);
  const [booking, setBooking]  = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get("/api/v1/bookings/my-bookings");
        const b = res.data.data.find(x => x._id === bookingId);
        if (b) setBooking(b);
      } catch (err) {
        console.error("Failed to load booking", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handlePay = async () => {
    if (method === "cod") {
      setLoading(true);
      setTimeout(() => navigate(`/bookings/${bookingId}/payment/status?success=true`), 1000);
      return;
    }
    
    setLoading(true);
    try {
      const orderRes = await api.post("/api/v1/payments/create-order", { bookingId });
      const orderData = orderRes.data.data;

      if (window.Razorpay) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag",
          amount: orderData.amount,
          currency: orderData.currency,
          name: "ViaPool",
          order_id: orderData.id,
          handler: async function (response) {
            try {
              await api.post("/api/v1/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId
              });
              navigate(`/bookings/${bookingId}/payment/status?success=true`);
            } catch (err) {
              navigate(`/bookings/${bookingId}/payment/status?success=false`);
            }
          },
          theme: { color: "#C4622D" }
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => navigate(`/bookings/${bookingId}/payment/status?success=false`));
        rzp.open();
        setLoading(false);
      } else {
        // Fallback simulate payment if script missing
        setTimeout(() => navigate(`/bookings/${bookingId}/payment/status?success=true`), 800);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  if (loading && !booking) return <AppShell title="Payment" role="passenger"><div className="auth-spinner" style={{margin: "40px auto"}}/></AppShell>;
  if (!booking) return <AppShell title="Not Found" role="passenger"><div style={{padding: 40, textAlign: "center"}}>Booking unavailable</div></AppShell>;

  const rideDate = new Date(booking.ride?.departureTime);

  return (
    <AppShell title="Payment" role="passenger" unreadCount={2}>
      <div className="page-header">
        <div className="page-header-eyebrow">Step 2 of 2</div>
        <h1 className="page-header-title">Choose <em>Payment</em></h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* Methods */}
        <div>
          <div className="payment-card">
            <div className="info-card-title">Payment Method</div>
            {METHODS.map(m => (
              <div
                key={m.id}
                className={`payment-method-row ${method === m.id ? "selected" : ""}`}
                onClick={() => setMethod(m.id)}
              >
                <div className="pm-icon">{m.icon}</div>
                <div className="pm-label">
                  <div className="pm-name">{m.name}</div>
                  <div className="pm-sub">{m.sub}</div>
                </div>
                <div className={`pm-radio ${method === m.id ? "checked" : ""}`} />
              </div>
            ))}
          </div>

          {/* UPI input */}
          {method === "upi" && (
            <div className="payment-card">
              <div className="info-card-title">Enter UPI ID</div>
              <input
                className="input"
                placeholder="yourname@upi"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
              />
              <p style={{ fontSize: "0.78rem", color: "var(--mist)", marginTop: 10, lineHeight: 1.6 }}>
                Enter your UPI ID. You'll receive a payment request on your UPI app.
              </p>
            </div>
          )}

          {/* Card input */}
          {method === "card" && (
            <div className="payment-card">
              <div className="info-card-title">Card Details</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label className="input-label">Card Number</label>
                  <input className="input" placeholder="•••• •••• •••• ••••" maxLength={19} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="input-label">Expiry</label>
                    <input className="input" placeholder="MM / YY" maxLength={7} />
                  </div>
                  <div>
                    <label className="input-label">CVV</label>
                    <input className="input" placeholder="•••" maxLength={4} type="password" />
                  </div>
                </div>
                <div>
                  <label className="input-label">Cardholder Name</label>
                  <input className="input" placeholder="Name on card" />
                </div>
              </div>
            </div>
          )}

          {method === "cod" && (
            <div className="payment-card">
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: "2rem" }}>💵</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--ink)", marginBottom: 6 }}>Pay to driver directly</div>
                  <p style={{ fontSize: "0.85rem", color: "var(--mist)", lineHeight: 1.7 }}>
                    Keep exact change ready. Pay the driver before the ride starts. Your booking is confirmed immediately.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Razorpay badge */}
          <div className="rzp-banner">
            <span>🔒 Secured by</span>
            <span className="rzp-logo">Razorpay</span>
            <span>· 256-bit encryption</span>
          </div>
        </div>

        {/* Order summary sidebar */}
        <div>
          <div className="info-card" style={{ position: "sticky", top: 88 }}>
            <div className="info-card-title">Order Summary</div>
            <div style={{ background: "var(--ink)", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.4)", marginBottom: 8 }}>Route</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", color: "var(--cream)", letterSpacing: "-0.02em" }}>
                {booking.ride?.from?.address?.split(",")[0] || "Unknown"} → {booking.ride?.to?.address?.split(",")[0] || "Unknown"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.4)", marginTop: 6 }}>
                {rideDate.toLocaleDateString()} · {rideDate.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · {booking.seatsBooked} seats
              </div>
            </div>
            <div className="fare-row total" style={{ border: "none" }}>
              <span>Total amount</span>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem" }}>₹{booking.totalPrice}</span>
            </div>
            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 20, padding: "16px", position: "relative" }}
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                  <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Processing…
                </span>
              ) : (
                `Pay ₹${booking.totalPrice} →`
              )}
            </button>
            <p style={{ fontSize: "0.72rem", color: "var(--mist)", textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
              By paying you agree to ViaPool's <span style={{ color: "var(--terracotta)", cursor: "pointer" }}>Terms of Service</span>
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
