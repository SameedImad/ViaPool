import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CarFront, Check, Map, Star } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

function preferenceList(preferences = {}) {
  if (Array.isArray(preferences)) return preferences;
  const list = [];
  if (preferences.allowPets) list.push("Pets welcome");
  if (preferences.preferredGender === "female") list.push("Women only");
  if (preferences.preferredGender === "male") list.push("Men only");
  return list;
}

function Stars({ count }) {
  return (
    <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} fill="var(--gold)" color="var(--gold)" />
      ))}
    </div>
  );
}

export default function RideDetail() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("details");
  const [ride, setRide] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/api/v1/rides/${rideId}`);
        const r = res.data;
        const d = new Date(r.departureTime);
        const toD = new Date(d.getTime() + 45 * 60000);
        const prefs = preferenceList(r.preferences);

        setRide({
          id: r._id,
          from: r.from?.address?.split(",")[0] || "Unknown",
          fromTime: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          to: r.to?.address?.split(",")[0] || "Unknown",
          toTime: toD.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          driver: {
            name: `${r.driver?.firstName} ${r.driver?.lastName}`,
            photo: r.driver?.profilePhoto,
            rating: r.driver?.overallRating || 0,
            reviews: r.driver?.totalRatings || 0,
            trips: r.driver?.tripsCount || 0,
            letter: r.driver?.firstName?.[0] || "D",
            since: r.driver?.createdAt ? new Date(r.driver.createdAt).getFullYear() : 2024,
            verified: r.driver?.isVerified || false,
            bio: r.driver?.bio || "Safe and punctual driver. Let's make commuting comfortable for everyone.",
          },
          vehicle: {
            make: `${r.vehicle?.brand} ${r.vehicle?.model}`,
            color: r.vehicle?.color || "Unknown",
            plate: r.vehicle?.registrationNumber || "Unknown",
            seats: r.totalSeats,
            ac: prefs.some((p) => p.toLowerCase().includes("ac")),
            year: r.vehicle?.year || "Unknown",
          },
          price: r.pricePerSeat,
          seatsLeft: r.availableSeats,
          amenities: [...prefs, ...(r.rideNotes ? [r.rideNotes] : [])],
        });
        setLoading(false);
        return r.driver?._id;
      } catch (err) {
        console.error("Failed to fetch ride", err);
        setLoading(false);
      }
    };

    const fetchReviews = async (driverId) => {
      try {
        const res = await api.get(`/api/v1/reviews/user/${driverId}`);
        setReviews(
          res.data.map((r) => ({
            id: r._id,
            name: `${r.reviewer?.firstName} ${r.reviewer?.lastName?.[0]}.`,
            stars: r.rating,
            date: new Date(r.createdAt).toLocaleDateString([], { day: "numeric", month: "short" }),
            comment: r.comment,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      }
    };

    fetchRide().then((driverId) => {
      if (driverId) fetchReviews(driverId);
    });
  }, [rideId]);

  if (loading) return <AppShell title="Loading..." role="passenger"><div className="auth-spinner" style={{ margin: "40px auto" }} /></AppShell>;
  if (!ride) return <AppShell title="Not Found" role="passenger"><div style={{ padding: 40, textAlign: "center" }}>Ride not found</div></AppShell>;

  return (
    <AppShell title="Ride Details" role="passenger" unreadCount={2}>
      <div className="rd-hero">
        <div className="rd-driver-block">
          {ride.driver.photo ? <img src={ride.driver.photo} alt={ride.driver.name} className="rd-av" style={{ objectFit: "cover" }} /> : <div className="rd-av">{ride.driver.letter}</div>}
          <div className="rd-driver-name">{ride.driver.name}</div>
          <div className="rd-driver-rating" style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <Star size={14} fill="var(--gold)" color="var(--gold)" /> {ride.driver.rating} · {ride.driver.reviews} reviews
          </div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {ride.driver.verified && (
              <span className="chip chip-forest" style={{ fontSize: "0.65rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Check size={12} /> Verified
              </span>
            )}
          </div>
        </div>

        <div className="rd-divider" />

        <div className="rd-route" style={{ flex: 1 }}>
          <div className="rd-route-row"><div className="rd-dot from" /><div><div className="rd-city">{ride.from}</div><div className="rd-city-time">{ride.fromTime}</div></div></div>
          <div className="rd-line" style={{ marginLeft: 5, marginBottom: 6 }} />
          <div className="rd-route-row"><div className="rd-dot to" /><div><div className="rd-city">{ride.to}</div><div className="rd-city-time">{ride.toTime}</div></div></div>
          <div style={{ marginTop: 16, fontSize: "0.78rem", color: "rgba(245,240,232,0.4)" }}>{ride.date} · {ride.seatsLeft} seat{ride.seatsLeft !== 1 ? "s" : ""} left</div>
        </div>

        <div className="rd-divider" />

        <div className="rd-price-block">
          <div className="rd-price-amt">Rs.{ride.price}</div>
          <div className="rd-price-label">per seat</div>
          <button className="btn-primary" style={{ marginTop: 20, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => navigate(`/rides/${rideId}/book`)}>
            Book Now <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="tab-bar">
        {["details", "vehicle", "reviews"].map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="info-card">
            <div className="info-card-title">About the Driver</div>
            <div style={{ fontSize: "0.9rem", color: "var(--mist)", lineHeight: 1.7, marginBottom: 16 }}>{ride.driver.bio}</div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[{ label: "Member since", val: ride.driver.since }, { label: "Total trips", val: `${ride.driver.trips}+` }, { label: "Rating", val: `${ride.driver.rating}` }].map((i) => (
                <div key={i.label}>
                  <div style={{ fontSize: "0.7rem", color: "var(--mist)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 3 }}>{i.label}</div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--ink)" }}>{i.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-title">Amenities</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ride.amenities.map((a) => (
                <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.9rem", color: "var(--ink)" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(45,74,53,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={12} />
                  </span>
                  {a}
                </div>
              ))}
            </div>
          </div>

          <div className="map-placeholder" style={{ height: 200, gridColumn: "1 / -1", borderRadius: 20 }}>
            <div className="map-grid" />
            <div className="map-pulse"><Map size={28} /></div>
            <div className="map-label">Route preview · {ride.from} to {ride.to}</div>
          </div>
        </div>
      )}

      {tab === "vehicle" && (
        <div className="info-card" style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 16, color: "var(--terracotta)" }}><CarFront size={52} /></div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 6 }}>{ride.vehicle.make}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", background: "var(--sand)", color: "var(--ink)", padding: "4px 12px", borderRadius: 6, display: "inline-block", marginBottom: 20 }}>{ride.vehicle.plate}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[{ label: "Color", val: ride.vehicle.color }, { label: "Year", val: ride.vehicle.year }, { label: "Seats", val: `${ride.vehicle.seats} passengers` }, { label: "AC", val: ride.vehicle.ac ? "Yes" : "No" }].map((v) => (
              <div key={v.label} style={{ background: "var(--cream)", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--sand)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--mist)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{v.label}</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--ink)" }}>{v.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "reviews" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Star size={24} fill="var(--gold)" color="var(--gold)" />
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", color: "var(--ink)" }}>{ride.driver.rating}</span>
            <span style={{ color: "var(--mist)", fontSize: "0.9rem" }}>{ride.driver.reviews} reviews</span>
          </div>
          {reviews.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--mist)" }}>No reviews yet for this driver</div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="review-item">
                <div className="ri-header">
                  <div className="ri-av">{r.name[0]}</div>
                  <div><div className="ri-name">{r.name}</div><div className="ri-date">{r.date}</div></div>
                  <Stars count={r.stars} />
                </div>
                <div className="ri-comment">{r.comment}</div>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ position: "fixed", bottom: 24, right: 40, display: "flex", gap: 12, zIndex: 50 }}>
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="btn-primary" onClick={() => navigate(`/rides/${rideId}/book`)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          Book This Ride <ArrowRight size={16} />
        </button>
      </div>
    </AppShell>
  );
}
