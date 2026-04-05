import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Armchair,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import StatusNotice from "../components/ui/StatusNotice";
import "../pages/AppShell.css";
import "../pages/Auth.css";
import "../pages/Passenger.css";

const ASPECTS = [
  { id: "punctuality", label: "Punctuality", icon: Clock3 },
  { id: "comfort", label: "Comfort", icon: Armchair },
  { id: "cleanliness", label: "Cleanliness", icon: Sparkles },
  { id: "safety", label: "Driving Safety", icon: ShieldCheck },
];

const RATING_LABELS = {
  1: "Very poor",
  2: "Needs work",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

export default function LeaveReview() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState(null);

  const activeRole = localStorage.getItem("via-role") || "passenger";

  useEffect(() => {
    let mounted = true;

    const loadRide = async () => {
      try {
        const res = await api.get(`/api/v1/rides/${rideId}`);
        if (!mounted) return;
        setRide(res?.data || null);
      } catch (err) {
        if (!mounted) return;
        setNotice({
          tone: "error",
          message: err?.body?.message || err.message || "We could not load this ride for review.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRide();

    return () => {
      mounted = false;
    };
  }, [rideId]);

  const handleSubmit = async () => {
    if (!ride?.driver?._id || !rating) {
      setNotice({
        tone: "error",
        message: "Please select a rating before submitting your review.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/v1/reviews", {
        rideId,
        reviewedUserId: ride.driver._id,
        rating,
        comment,
      });
      setSubmitted(true);
    } catch (err) {
      setNotice({
        tone: "error",
        message: err?.body?.message || err.message || "Review submission failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Leave Review" role={activeRole}>
        <div className="auth-spinner" style={{ margin: "40px auto" }} />
      </AppShell>
    );
  }

  if (!ride) {
    return (
      <AppShell title="Leave Review" role={activeRole}>
        <div style={{ padding: 40, textAlign: "center", color: "var(--mist)" }}>Ride details could not be loaded</div>
      </AppShell>
    );
  }

  if (submitted) {
    return (
      <AppShell title="Review Submitted" role={activeRole}>
        <div className="status-card">
          <div className="status-icon success">
            <CheckCircle2 size={40} color="var(--forest)" />
          </div>
          <div className="status-title">Review Submitted</div>
          <p className="status-sub">
            Thanks for sharing feedback about this ride. Your review is now visible on the driver profile.
          </p>
          <button className="btn-primary" onClick={() => navigate("/passenger/bookings")} style={{ padding: "12px 24px" }}>
            Back to Bookings
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Leave Review" role={activeRole}>
      <StatusNotice
        tone={notice?.tone}
        message={notice?.message}
        onClose={() => setNotice(null)}
        style={{ marginBottom: notice ? 18 : 0 }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button className="btn-outline" onClick={() => navigate(-1)} style={{ padding: "10px 16px", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="layout-sidebar-grid sidebar-340">
        <div className="info-card">
          <div className="info-card-title">Rate Your Ride</div>
          <p style={{ color: "var(--mist)", lineHeight: 1.7, marginBottom: 22 }}>
            Share your experience with {ride.driver?.firstName || "the driver"} for the ride from{" "}
            <strong style={{ color: "var(--ink)" }}>{ride.from?.address?.split(",")[0] || "pickup"}</strong> to{" "}
            <strong style={{ color: "var(--ink)" }}>{ride.to?.address?.split(",")[0] || "destination"}</strong>.
          </p>

          <div className="star-picker">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const active = value <= rating;
              return (
                <button
                  key={value}
                  type="button"
                  className={`star-btn ${active ? "lit" : ""}`}
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                >
                  <Star size={22} fill={active ? "var(--gold)" : "transparent"} color={active ? "var(--gold)" : "var(--mist)"} />
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: "0.9rem", color: "var(--mist)", marginBottom: 22 }}>
            {rating ? RATING_LABELS[rating] : "Select a rating to continue"}
          </div>

          <label className="auth-label">What stood out?</label>
          <div className="layout-card-grid-2" style={{ marginBottom: 22 }}>
            {ASPECTS.map(({ id, label, icon: Icon }) => (
              <div
                key={id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1px solid var(--sand)",
                  background: "var(--cream)",
                  color: "var(--ink)",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                }}
              >
                <Icon size={16} color="var(--terracotta)" />
                {label}
              </div>
            ))}
          </div>

          <div className="auth-field">
            <label className="auth-label">Additional comments</label>
            <textarea
              className="auth-input"
              rows={5}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Tell future passengers what this ride was like."
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ marginTop: 22 }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ padding: "12px 24px" }}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>

        <div className="info-card sticky-card">
          <div className="info-card-title">Ride Summary</div>
          <div style={{ marginBottom: 14, color: "var(--mist)", fontSize: "0.85rem" }}>Driver</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <div className="rc-avatar" style={{ width: 52, height: 52, fontSize: "1.1rem" }}>
              {ride.driver?.firstName?.[0] || "D"}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>
                {ride.driver?.firstName} {ride.driver?.lastName || ""}
              </div>
              <div style={{ color: "var(--mist)", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }}>
                <Star size={14} fill="var(--gold)" color="var(--gold)" />
                {(ride.driver?.overallRating || 0).toFixed(1)} average rating
              </div>
            </div>
          </div>

          <div className="fare-row">
            <span>From</span>
            <span>{ride.from?.address?.split(",")[0] || "Pickup"}</span>
          </div>
          <div className="fare-row">
            <span>To</span>
            <span>{ride.to?.address?.split(",")[0] || "Destination"}</span>
          </div>
          <div className="fare-row">
            <span>Date</span>
            <span>
              {ride.departureTime
                ? new Date(ride.departureTime).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Scheduled"}
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
