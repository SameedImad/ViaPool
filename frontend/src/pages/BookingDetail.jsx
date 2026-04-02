import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatusNotice from "../components/ui/StatusNotice";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

const STATUS_BADGE = {
  upcoming: "badge-pending",
  completed: "badge-verified",
  cancelled: "badge-rejected",
};

const PAYMENT_METHOD_LABELS = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  wallet: "Wallet",
  cash: "Cash to Driver",
};

export default function BookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get("/api/v1/bookings/my-bookings");
        const b = res.data.find((item) => item._id === bookingId);

        if (b) {
          setBooking(b);
          setNotice(null);
        }
      } catch (err) {
        setNotice({
          tone: "error",
          message: err?.body?.message || err.message || "We could not load this booking right now.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, location.key]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.patch(`/api/v1/bookings/${bookingId}/cancel`);
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              bookingStatus: "cancelled",
            }
          : prev,
      );
      setNotice({
        tone: "success",
        message: "Booking cancelled. Refunds for prepaid rides are typically processed within 5-7 business days.",
      });
      setShowCancelDialog(false);
    } catch (err) {
      setNotice({
        tone: "error",
        message: err?.body?.message || err.message || "Cancellation failed.",
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Loading..." role="passenger">
        <div className="auth-spinner" style={{ margin: "40px auto" }} />
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell title="Not Found" role="passenger">
        <div style={{ padding: 40, textAlign: "center" }}>Booking not found</div>
      </AppShell>
    );
  }

  const departure = booking.ride?.departureTime ? new Date(booking.ride.departureTime) : null;
  const status =
    booking.bookingStatus === "cancelled"
      ? "cancelled"
      : booking.ride?.status === "completed"
        ? "completed"
        : "upcoming";
  const driverName = booking.ride?.driver
    ? `${booking.ride.driver.firstName} ${booking.ride.driver.lastName}`.trim()
    : "Unknown";
  const driverRating =
    typeof booking.ride?.driver?.overallRating === "number"
      ? booking.ride.driver.overallRating.toFixed(1)
      : "New";
  const vehicleLabel = [booking.ride?.vehicle?.brand, booking.ride?.vehicle?.model]
    .filter(Boolean)
    .join(" ");
  const registration = booking.ride?.vehicle?.registrationNumber || "Registration pending";
  const paymentMode =
    PAYMENT_METHOD_LABELS[booking.payment?.paymentMethod] ||
    (booking.paymentStatus === "paid" ? "Online payment" : "Payment pending");
  const paymentReference =
    booking.payment?.transactionId ||
    booking.payment?.providerOrderId ||
    (booking.paymentStatus === "paid" ? "Captured" : "Pending");
  const isCancelled = booking.bookingStatus === "cancelled";
  const isCancellable = status === "upcoming" && !isCancelled;

  return (
    <AppShell title="Booking Detail" role="passenger" unreadCount={2}>
      <StatusNotice
        tone={notice?.tone}
        message={notice?.message}
        onClose={() => setNotice(null)}
        style={{ marginBottom: notice ? 18 : 0 }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <button className="btn-outline" onClick={() => navigate("/passenger/bookings")} style={{ padding: "8px 16px" }}>
          Back
        </button>
        <span className={`badge ${STATUS_BADGE[status]}`}>
          {status}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        <div>
          <div className="booking-detail-hero">
            <div className="bd-ref">Booking ID - {bookingId || booking._id}</div>
            <div className="bd-route">
              <div className="bd-stop">
                <div className="bd-stop-dot from" />
                <div className="bd-stop-city">{booking.ride?.from?.address?.split(",")[0] || "Unknown"}</div>
                <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "rgba(245,240,232,0.4)" }}>
                  {departure
                    ? departure.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Unknown"}
                </span>
              </div>
              <div className="bd-stop-line" style={{ marginLeft: 4 }} />
              <div className="bd-stop">
                <div className="bd-stop-dot to" />
                <div className="bd-stop-city">{booking.ride?.to?.address?.split(",")[0] || "Unknown"}</div>
                <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "rgba(245,240,232,0.4)" }}>
                  {booking.ride?.arrivalTime
                    ? new Date(booking.ride.arrivalTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "TBD"}
                </span>
              </div>
            </div>
            <div className="bd-meta-row">
              {[
                {
                  label: "Date",
                  val: departure
                    ? departure.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Unknown",
                },
                { label: "Seats", val: booking.seatsBooked },
                { label: "Mode", val: paymentMode },
                {
                  label: "Reference",
                  val:
                    paymentReference.length > 16
                      ? `${paymentReference.slice(0, 12)}...`
                      : paymentReference,
                },
              ].map((item) => (
                <div className="bd-meta-item" key={item.label}>
                  <strong>{item.val}</strong>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="info-card" style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
            <div className="rc-avatar" style={{ width: 52, height: 52, fontSize: "1.2rem" }}>
              {booking.ride?.driver?.firstName?.[0] || "D"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", marginBottom: 3 }}>
                {driverName}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--mist)" }}>
                * {driverRating} - {vehicleLabel || "Vehicle assigned soon"} - {registration}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {booking.ride?._id && booking.ride?.driver?._id && (
                <button
                  className="btn-outline"
                  style={{ padding: "8px 16px" }}
                  onClick={() =>
                    navigate(`/rides/${booking.ride._id}/chat/driver/${booking.ride.driver._id}`)
                  }
                >
                  Chat
                </button>
              )}
              {booking.ride?._id && status === "upcoming" && !isCancelled && (
                <button
                  className="btn-outline"
                  style={{ padding: "8px 16px" }}
                  onClick={() => navigate(`/rides/${booking.ride._id}/track`)}
                >
                  Track
                </button>
              )}
            </div>
          </div>

          {booking.passengerNote ? (
            <div className="info-card" style={{ marginBottom: 16 }}>
              <div className="info-card-title">Note for Driver</div>
              <p style={{ fontSize: "0.84rem", color: "var(--mist)", lineHeight: 1.7 }}>
                {booking.passengerNote}
              </p>
            </div>
          ) : null}

          {isCancellable && (
            <div
              className="info-card"
              style={{ borderColor: "rgba(196,98,45,0.3)", background: "rgba(196,98,45,0.03)" }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)", marginBottom: 6 }}>
                Cancel Booking
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--mist)", marginBottom: 14, lineHeight: 1.6 }}>
                Cancel at least 30 minutes before departure for a full refund. Late cancellations may incur a fee.
              </p>
              <button
                className="btn-reject"
                style={{ padding: "11px 22px", borderRadius: 12 }}
                onClick={() => setShowCancelDialog(true)}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Cancel This Booking"}
              </button>
            </div>
          )}

          {isCancelled && (
            <div
              className="info-card"
              style={{
                borderColor: "rgba(45,74,53,0.3)",
                background: "rgba(45,74,53,0.04)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>Done</div>
              <div style={{ fontWeight: 700, color: "var(--forest)", marginBottom: 4 }}>Booking Cancelled</div>
              <p style={{ fontSize: "0.82rem", color: "var(--mist)" }}>
                Refund will be credited within 5-7 business days.
              </p>
            </div>
          )}

          {status === "completed" && !isCancelled && booking.ride?._id && (
            <button className="btn-primary" style={{ padding: "12px 28px" }} onClick={() => navigate(`/rides/${booking.ride._id}/review`)}>
              Leave a Review
            </button>
          )}
        </div>

        <div>
          <div className="info-card" style={{ position: "sticky", top: 88 }}>
            <div className="info-card-title">Receipt</div>
            <div className="fare-row">
              <span>Ride fare</span>
              <span>Rs.{booking.totalPrice || 0}</span>
            </div>
            <div className="fare-row total">
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem" }}>
                Rs.{booking.totalPrice || 0}
              </span>
            </div>
            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                background: "rgba(45,74,53,0.06)",
                borderRadius: 10,
                fontSize: "0.75rem",
                color: "var(--mist)",
                lineHeight: 1.6,
                border: "1px solid rgba(45,74,53,0.15)",
              }}
            >
              Payment via {paymentMode} - {paymentReference}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showCancelDialog}
        title="Cancel this booking?"
        message="Cancel at least 30 minutes before departure to avoid late cancellation issues. We will keep your receipt details available in My Bookings."
        confirmLabel="Cancel Booking"
        danger
        busy={cancelling}
        onCancel={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
      />
    </AppShell>
  );
}
