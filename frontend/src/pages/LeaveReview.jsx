import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

const ASPECTS = [
  { id: "punctuality",  label: "Punctuality",     icon: "⏰" },
  { id: "comfort",      label: "Comfort",          icon: "🛋️" },
  { id: "cleanliness",  label: "Cleanliness",      icon: "✨" },
  { id: "driving",      label: "Driving Safety",   icon: "🛡️" },
];

export default function LeaveReview() {
  const { rideId }   = useParams();
  const navigate     = useNavigate();
  const [overall,    setOverall]    = useState(0);
  const [aspects,    setAspects]    = useState({ punctuality: 0, comfort: 0, cleanliness: 0, driving: 0 });
  const [comment,    setComment]    = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [hover,      setHover]      = useState(0);
  const [ride,       setRide]       = useState(null);
  const [loading,    setLoading]    = useState(true);

  useState(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/api/v1/rides/${rideId}`);
        setRide(res.data.data);
      } catch (err) {
        console.error("Failed to fetch ride for review", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRide();
  }, [rideId]);

  const handleSubmit = async () => {
    if (overall === 0 || !ride) return;
    try {
      await api.post("/api/v1/reviews", {
        rideId,
        reviewedUserId: ride.driver._id,
        rating: overall,
        comment
      });
      setSubmitted(true);
      setTimeout(() => navigate("/passenger/bookings"), 2500);
    } catch (err) {
      alert("Failed to submit review: " + (err.response?.data?.message || err.message));
    }
  };

  if (submitted) return (
    <AppShell title="Review Submitted" role="passenger" unreadCount={2}>
      <div className="status-card">
        <div className="status-icon success" style={{ fontSize: "2.8rem" }}>🌟</div>
        <div className="status-title">Thank you!</div>
        <div className="status-sub">Your review for {ride?.driver?.firstName} {ride?.driver?.lastName} has been submitted. It helps other passengers make better choices.</div>
        <div style={{ color: "var(--mist)", fontSize: "0.82rem" }}>Redirecting to bookings…</div>
      </div>
    </AppShell>
  );

  return (
    <AppShell title="Leave a Review" role="passenger" unreadCount={2}>
      <div className="page-header">
        <div className="page-header-eyebrow">Post-trip</div>
        <h1 className="page-header-title">Rate Your <em>Experience</em></h1>
        <div className="page-header-sub">Reviews are only visible after your ride is completed</div>
      </div>

      <div style={{ maxWidth: 600 }}>
        {/* Driver card */}
        <div className="info-card" style={{ display: "flex", align: "center", gap: 16, marginBottom: 24 }}>
          <div className="rc-avatar" style={{ width: 56, height: 56, fontSize: "1.3rem" }}>
            {ride?.driver?.firstName?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink)", marginBottom: 4 }}>
              {ride?.driver?.firstName} {ride?.driver?.lastName}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--mist)" }}>
              {ride?.from?.address?.split(',')[0]} → {ride?.to?.address?.split(',')[0]} · {new Date(ride?.departureTime).toLocaleDateString()}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--mist)" }}>
              {ride?.vehicle?.brand} {ride?.vehicle?.model} · {ride?.vehicle?.registrationNumber}
            </div>
          </div>
        </div>

        {/* Overall star rating */}
        <div className="info-card" style={{ marginBottom: 16 }}>
          <div className="info-card-title">Overall Rating <span style={{ color: "var(--terracotta)" }}>*</span></div>
          <div className="star-picker">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                className={`star-btn ${n <= (hover || overall) ? "lit" : ""}`}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setOverall(n)}
                aria-label={`${n} star`}
              >
                ★
              </button>
            ))}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--mist)", marginTop: 4 }}>
            {["", "Poor 😕", "Below average 😐", "Average 🙂", "Good 😊", "Excellent! 🌟"][hover || overall] || "Tap to rate"}
          </div>
        </div>

        {/* Aspect ratings */}
        <div className="info-card" style={{ marginBottom: 16 }}>
          <div className="info-card-title">Rate Specific Aspects</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {ASPECTS.map(a => (
              <div key={a.id} style={{ background: "var(--cream)", borderRadius: 14, padding: "14px 16px", border: "1px solid var(--sand)" }}>
                <div style={{ fontSize: "0.78rem", color: "var(--mist)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  {a.icon} {a.label}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setAspects(prev => ({ ...prev, [a.id]: n }))}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: "1.5px solid var(--sand)",
                        background: n <= aspects[a.id] ? "rgba(201,168,76,0.15)" : "transparent",
                        borderColor: n <= aspects[a.id] ? "var(--gold)" : "var(--sand)",
                        cursor: "pointer", fontSize: "0.9rem",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="info-card" style={{ marginBottom: 24 }}>
          <div className="info-card-title">Write a Review</div>
          <textarea
            className="input"
            rows={5}
            placeholder="Share your experience with other passengers… Was the driver punctual? Was the car comfortable? Any tips?"
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ resize: "vertical" }}
          />
          <div style={{ fontSize: "0.72rem", color: "var(--mist)", marginTop: 6, textAlign: "right" }}>
            {comment.length}/500
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={overall === 0}
            style={{ flex: 1 }}
          >
            Submit Review →
          </button>
        </div>
        {overall === 0 && (
          <p style={{ fontSize: "0.78rem", color: "var(--terracotta)", marginTop: 10 }}>
            Please select an overall star rating to submit.
          </p>
        )}
      </div>
    </AppShell>
  );
}
