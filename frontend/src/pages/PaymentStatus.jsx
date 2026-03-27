import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

const RECEIPT = {
  from: "Hitech City", to: "Banjara Hills",
  date: "27 Mar 2026", time: "08:45 AM",
  seats: 2, driver: "Arjun Sharma", car: "Swift Dzire",
  subtotal: 480, fee: 15, insurance: 10, total: 505,
  txnId: "TXN_" + Math.random().toString(36).slice(2, 10).toUpperCase(),
};

export default function PaymentStatus() {
  const { bookingId }   = useParams();
  const [params]        = useSearchParams();
  const navigate        = useNavigate();
  const success         = params.get("success") !== "false";

  return (
    <AppShell title={success ? "Booking Confirmed" : "Payment Failed"} role="passenger" unreadCount={2}>
      <div className="status-card">
        {success ? (
          <>
            <div className="status-icon success">🎉</div>
            <div className="status-title">Booking Confirmed!</div>
            <div className="status-sub">
              Your ride from <strong>{RECEIPT.from}</strong> to <strong>{RECEIPT.to}</strong> is confirmed.
              The driver will be notified immediately.
            </div>
          </>
        ) : (
          <>
            <div className="status-icon failure">😞</div>
            <div className="status-title">Payment Failed</div>
            <div className="status-sub">
              Something went wrong with your payment. Your booking has not been confirmed.
              No money has been deducted.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28 }}>
              <button className="btn-secondary" onClick={() => navigate(-1)}>Try Again</button>
              <button className="btn-outline"   onClick={() => navigate("/search")}>Browse Rides</button>
            </div>
          </>
        )}

        {success && (
          <>
            {/* Receipt */}
            <div style={{ background: "var(--cream)", border: "1px solid var(--sand)", borderRadius: 16, padding: "20px 22px", marginBottom: 24, textAlign: "left" }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", color: "var(--ink)", marginBottom: 14, letterSpacing: "-0.02em" }}>Receipt</div>
              {[
                { label: "Booking ID",   val: bookingId || "BK_A1B2C3D4" },
                { label: "Transaction",  val: RECEIPT.txnId },
                { label: "Route",        val: `${RECEIPT.from} → ${RECEIPT.to}` },
                { label: "Date & Time",  val: `${RECEIPT.date} · ${RECEIPT.time}` },
                { label: "Seats",        val: RECEIPT.seats },
                { label: "Driver",       val: RECEIPT.driver },
                { label: "Vehicle",      val: RECEIPT.car },
              ].map(r => (
                <div key={r.label} className="receipt-row">
                  <span>{r.label}</span>
                  <span>{r.val}</span>
                </div>
              ))}
              <div className="receipt-row" style={{ marginTop: 4, paddingTop: 12, borderTop: "1px dashed var(--sand)", borderBottom: "none", fontWeight: 700 }}>
                <span style={{ color: "var(--ink)" }}>Total Paid</span>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--ink)" }}>₹{RECEIPT.total}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-primary" onClick={() => navigate(`/rides/${bookingId?.replace("bk_","r")}/track`)}>
                Track Ride 📍
              </button>
              <button className="btn-secondary" onClick={() => navigate("/passenger/bookings")}>
                My Bookings
              </button>
            </div>

            {/* Share */}
            <div style={{ marginTop: 24, padding: "14px 18px", background: "rgba(45,74,53,0.06)", borderRadius: 12, border: "1px solid rgba(45,74,53,0.15)", fontSize: "0.82rem", color: "var(--mist)", lineHeight: 1.6 }}>
              📩 A confirmation has been sent to your registered email and phone number.
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
