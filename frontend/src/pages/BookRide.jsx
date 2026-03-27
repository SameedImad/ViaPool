import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User, Car, Minus, Plus, ArrowRight } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

const RIDE = {
  id: "r1",
  from: "Hitech City", to: "Banjara Hills",
  date: "Today, 27 Mar", time: "08:45 AM",
  driver: "Arjun Sharma", car: "Swift Dzire",
  pricePerSeat: 240, maxSeats: 3,
};

const CONVENIENCE_FEE = 15;
const INSURANCE_FEE   = 10;

export default function BookRide() {
  const { rideId } = useParams();
  const navigate   = useNavigate();

  const [seats,    setSeats]    = useState(1);
  const [pickup,   setPickup]   = useState("");
  const [dropoff,  setDropoff]  = useState("");
  const [note,     setNote]     = useState("");
  const [ride,     setRide]     = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/api/v1/rides/${rideId}`);
        const r = res.data;
        const d = new Date(r.departureTime);
        setRide({
          from: r.from?.address?.split(',')[0] || "Unknown",
          to: r.to?.address?.split(',')[0] || "Unknown",
          date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          time: d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          driver: `${r.driver?.firstName} ${r.driver?.lastName}`,
          car: `${r.vehicle?.brand} ${r.vehicle?.model}`,
          pricePerSeat: r.pricePerSeat,
          maxSeats: r.availableSeats,
        });
      } catch (err) {
        console.error("Failed to load ride", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRide();
  }, [rideId]);

  const base  = seats * (ride ? ride.pricePerSeat : 0);
  const total = base + CONVENIENCE_FEE + INSURANCE_FEE;

  const handleConfirm = async () => {
    try {
      const payload = {
        rideId,
        seatsBooked: seats,
        pickupPoint: pickup ? { coordinates: [78.38, 17.44], type: "Point", address: pickup } : undefined,
        dropPoint: dropoff ? { coordinates: [78.38, 17.44], type: "Point", address: dropoff } : undefined,
      };
      const res = await api.post("/api/v1/bookings/book", payload);
      navigate(`/bookings/${res.data._id}/payment`);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Booking failed");
    }
  };

  if (loading) return <AppShell title="Loading..." role="passenger"><div className="auth-spinner" style={{margin: "40px auto"}}/></AppShell>;
  if (!ride) return <AppShell title="Not Found" role="passenger"><div style={{padding: 40, textAlign: "center"}}>Ride unavailable</div></AppShell>;

  return (
    <AppShell title="Confirm Booking" role="passenger" unreadCount={2}>
      <div className="page-header">
        <div className="page-header-eyebrow">Step 1 of 2</div>
        <h1 className="page-header-title">Review & <em>Confirm</em></h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        <div>
          {/* Ride summary */}
          <div className="book-summary">
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(245,240,232,0.4)", marginBottom: 16 }}>
              Your ride
            </div>
            <div className="book-route-row">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginRight: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--ember)" }} />
                <div style={{ width: 2, height: 28, background: "rgba(255,255,255,0.12)" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--moss)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="book-city" style={{ marginBottom: 16 }}>{ride.from}</div>
                <div className="book-city">{ride.to}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.45)", marginBottom: 4 }}>{ride.date}</div>
                <div style={{ color: "var(--ember)", fontWeight: 700 }}>{ride.time}</div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span className="chip chip-cream" style={{ fontSize: "0.65rem", display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={12} /> {ride.driver}
              </span>
              <span className="chip chip-cream" style={{ fontSize: "0.65rem", display: 'flex', alignItems: 'center', gap: 4 }}>
                <Car size={12} /> {ride.car}
              </span>
            </div>
          </div>

          {/* Seat picker */}
          <div className="seat-picker" style={{ marginBottom: 16 }}>
            <div>
              <div className="sp-label">Number of seats</div>
              <div className="sp-sub">{ride.maxSeats} seats available</div>
            </div>
            <div className="sp-controls">
              <button className="sp-btn" onClick={() => setSeats(s => Math.max(1, s - 1))} disabled={seats <= 1}><Minus size={14} /></button>
              <div className="sp-count">{seats}</div>
              <button className="sp-btn" onClick={() => setSeats(s => Math.min(ride.maxSeats, s + 1))} disabled={seats >= ride.maxSeats}><Plus size={14} /></button>
            </div>
          </div>

          {/* Pickup / drop notes */}
          <div className="info-card">
            <div className="info-card-title">Pickup & Drop Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="input-label">Pickup landmark (optional)</label>
                <input className="input" placeholder="e.g. Near Inorbit Mall gate 2" value={pickup} onChange={e => setPickup(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Drop landmark (optional)</label>
                <input className="input" placeholder="e.g. Apollo Pharmacy, Banjara Hills" value={dropoff} onChange={e => setDropoff(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Message to driver (optional)</label>
                <textarea className="input" rows={3} placeholder="Any special request or note for the driver…" value={note} onChange={e => setNote(e.target.value)} style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Fare breakdown sidebar */}
        <div>
          <div className="info-card" style={{ position: "sticky", top: 88 }}>
            <div className="info-card-title">Price Breakdown</div>

            <div className="fare-row">
              <span>₹{ride.pricePerSeat} × {seats} seat{seats !== 1 ? "s" : ""}</span>
              <span>₹{base}</span>
            </div>
            <div className="fare-row">
              <span>Convenience fee</span>
              <span>₹{CONVENIENCE_FEE}</span>
            </div>
            <div className="fare-row">
              <span>Travel insurance</span>
              <span>₹{INSURANCE_FEE}</span>
            </div>
            <div className="fare-row total" style={{ paddingTop: 16, marginTop: 4 }}>
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", letterSpacing: "-0.02em" }}>₹{total}</span>
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 24, padding: "16px" }}
              onClick={handleConfirm}
            >
              Proceed to Payment <ArrowRight size={18} />
            </button>

            <p style={{ fontSize: "0.72rem", color: "var(--mist)", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
              Free cancellation up to 30 minutes before departure.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
