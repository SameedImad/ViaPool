import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Car,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import StatusNotice from "../components/ui/StatusNotice";
import "../pages/AppShell.css";
import "../pages/Auth.css";
import "../pages/Driver.css";

const STATUS_STYLE = {
  confirmed: { cls: "badge-verified", label: "Confirmed", icon: CheckCircle },
  completed: { cls: "badge-verified", label: "Completed", icon: CheckCircle },
  cancelled: { cls: "badge-rejected", label: "Cancelled", icon: Clock },
};

const PAYMENT_METHOD_LABELS = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  wallet: "Wallet",
  cash: "Cash",
};

export default function RideManagement() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState([]);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [pickupingId, setPickupingId] = useState(null);
  const [startingRide, setStartingRide] = useState(false);

  const activeRole = localStorage.getItem("via-role") || "driver";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rideRes, passRes] = await Promise.all([
          api.get(`/api/v1/rides/${rideId}`),
          api.get(`/api/v1/bookings/${rideId}/passengers`),
        ]);

        const currentRide = rideRes.data;
        const departure = new Date(currentRide.departureTime);

        setRide({
          id: currentRide._id,
          from: currentRide.from?.address?.split(",")[0] || "Unknown",
          to: currentRide.to?.address?.split(",")[0] || "Unknown",
          date: departure.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          time: departure.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          seats: currentRide.totalSeats,
          fare: currentRide.pricePerSeat,
          status: currentRide.status,
        });

        const formattedPassengers = (passRes.data || []).map((booking) => ({
          id: booking._id,
          passengerId: booking.passenger?._id,
          name:
            `${booking.passenger?.firstName || ""} ${booking.passenger?.lastName || ""}`.trim() ||
            "Unknown passenger",
          letter: booking.passenger?.firstName?.[0] || "U",
          rating:
            typeof booking.passenger?.overallRating === "number"
              ? booking.passenger.overallRating.toFixed(1)
              : "New",
          seats: booking.seatsBooked,
          pickup: booking.pickupPoint?.address || "Ride origin",
          status: booking.bookingStatus,
          paid: booking.paymentStatus === "paid",
          pickedUp: Boolean(booking.isPickedUp),
          paymentMethod:
            PAYMENT_METHOD_LABELS[booking.payment?.paymentMethod] ||
            (booking.paymentStatus === "paid" ? "Online" : "Pending"),
          paymentLabel:
            booking.paymentStatus === "paid"
              ? booking.payment?.transactionId || "Captured"
              : booking.payment?.paymentMethod === "cash"
                ? "Collect at pickup"
                : "Awaiting payment",
        }));

        setPassengers(formattedPassengers);
        setNotice(null);
      } catch (err) {
        setNotice({
          tone: "error",
          message:
            err?.body?.message || err.message || "We could not load this ride's passenger list.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rideId]);

  const markPickedUp = async (bookingId) => {
    try {
      setPickupingId(bookingId);
      await api.patch(`/api/v1/rides/${rideId}/booking/${bookingId}/pickup`);
      setPassengers((currentPassengers) =>
        currentPassengers.map((passenger) =>
          passenger.id === bookingId
            ? { ...passenger, pickedUp: true }
            : passenger,
        ),
      );
      setNotice({
        tone: "success",
        message: "Passenger marked as picked up.",
      });
    } catch (err) {
      setNotice({
        tone: "error",
        message: err?.body?.message || err.message || "We could not mark that pickup.",
      });
    } finally {
      setPickupingId(null);
    }
  };

  const startRide = async () => {
    try {
      setStartingRide(true);
      await api.patch(`/api/v1/rides/${rideId}/status`, { status: "ongoing" });
      navigate(`/driver/rides/${rideId}/live`);
    } catch (err) {
      setNotice({
        tone: "error",
        message: err?.body?.message || err.message || "We could not start the live ride.",
      });
      setStartingRide(false);
    }
  };

  const confirmedPassengers = passengers.filter((passenger) =>
    ["confirmed", "completed"].includes(passenger.status),
  );
  const totalEarnings = confirmedPassengers.reduce(
    (sum, passenger) => sum + passenger.seats * (ride?.fare || 0),
    0,
  );

  if (loading) {
    return (
      <AppShell title="Loading..." role={activeRole}>
        <div className="auth-spinner" style={{ margin: "40px auto" }} />
      </AppShell>
    );
  }

  if (!ride) {
    return (
      <AppShell title="Not Found" role={activeRole}>
        <div style={{ padding: 40 }}>Ride details not found</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Ride Management" role={activeRole} unreadCount={3}>
      <StatusNotice
        tone={notice?.tone}
        message={notice?.message}
        onClose={() => setNotice(null)}
        style={{ marginBottom: notice ? 18 : 0 }}
      />

      <div className="page-header">
        <div className="page-header-eyebrow">Ride #{rideId.slice(-6).toUpperCase()}</div>
        <h1 className="page-header-title">
          {ride.from} to <em>{ride.to}</em>
        </h1>
        <p className="page-header-sub">
          {ride.date} · {ride.time} · {ride.seats} seats
        </p>
      </div>

      <div className="ride-mgmt-grid layout-sidebar-grid sidebar-320">
        <div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.25rem",
              color: "var(--ink)",
              marginBottom: 20,
            }}
          >
            Confirmed Passengers ({passengers.length})
          </div>

          {passengers.length === 0 ? (
            <div className="info-card">
              <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
                No passengers yet
              </div>
              <div style={{ fontSize: "0.84rem", color: "var(--mist)", lineHeight: 1.6 }}>
                This ride does not have any active bookings yet.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {passengers.map((passenger) => {
                const details = STATUS_STYLE[passenger.status] || STATUS_STYLE.confirmed;
                const Icon = details.icon;

                return (
                  <div className="ride-passenger-card" key={passenger.id}>
                    <div className="ride-passenger-avatar">
                      {passenger.letter}
                    </div>
                    <div className="pr-info" style={{ flex: 1 }}>
                      <div className="pr-name" style={{ fontWeight: 700, color: "var(--ink)" }}>
                        {passenger.name}
                      </div>
                      <div
                        className="pr-sub"
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--mist)",
                          marginTop: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <Star size={12} fill="var(--ember)" color="var(--ember)" />
                        {passenger.rating} · {passenger.seats} seat
                        {passenger.seats > 1 ? "s" : ""} · Pickup: {passenger.pickup}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--mist)", marginTop: 6 }}>
                        Payment: {passenger.paymentMethod} · {passenger.paymentLabel}
                      </div>
                    </div>

                    <div className="ride-passenger-actions">
                      <span
                        className={`badge ${details.cls}`}
                        style={{ display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Icon size={12} /> {details.label}
                      </span>

                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          border: passenger.paid
                            ? "1.5px solid rgba(45,74,53,0.3)"
                            : "1.5px solid rgba(196,98,45,0.25)",
                          background: passenger.paid
                            ? "rgba(45,74,53,0.08)"
                            : "rgba(196,98,45,0.06)",
                          color: passenger.paid ? "var(--forest)" : "var(--terracotta)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {passenger.paid ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {passenger.paid ? "Paid" : "Unpaid"}
                      </span>

                      <button
                        className="btn-outline"
                        style={{ padding: "8px", borderRadius: 10 }}
                        onClick={() => navigate(`/driver/rides/${rideId}/chat/${passenger.passengerId}`)}
                      >
                        <MessageCircle size={16} />
                      </button>

                      {passenger.status === "confirmed" && !passenger.pickedUp ? (
                        <button
                          className="btn-primary"
                          style={{
                            padding: "8px 16px",
                            fontSize: "0.8rem",
                            background: "var(--forest)",
                          }}
                          onClick={() => markPickedUp(passenger.id)}
                          disabled={pickupingId === passenger.id}
                        >
                          {pickupingId === passenger.id ? "Updating..." : "Pick Up"}
                        </button>
                      ) : null}
                      {passenger.pickedUp ? (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--forest)",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <CheckCircle size={14} /> Picked Up
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="layout-stack" style={{ gap: 16 }}>
          <div className="info-card">
            <div className="info-card-title">Payment Summary</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {confirmedPassengers.map((passenger) => (
                <div
                  key={passenger.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: 10,
                    borderBottom: "1px solid var(--sand)",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", color: "var(--mist)" }}>
                    {passenger.name} ({passenger.seats} seat{passenger.seats > 1 ? "s" : ""})
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      color: passenger.paid ? "var(--forest)" : "var(--terracotta)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Rs.{passenger.seats * ride.fare}
                    {passenger.paid ? <CheckCircle size={14} /> : <Clock size={14} />}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 16,
                paddingTop: 12,
                borderTop: "2px solid var(--sand)",
              }}
            >
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}>Total</span>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.3rem",
                  color: "var(--ink)",
                  fontWeight: 800,
                }}
              >
                Rs.{totalEarnings}
              </span>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "1rem", gap: 10 }}
            onClick={startRide}
            disabled={startingRide || ride.status === "ongoing"}
          >
            <Car size={20} />
            {ride.status === "ongoing"
              ? "Ride In Progress"
              : startingRide
                ? "Starting..."
                : "Start Live Ride"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
