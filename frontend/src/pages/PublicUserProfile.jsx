import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Flag,
  MapPin,
  Route,
  Star,
  UserRound,
} from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import StatusNotice from "../components/ui/StatusNotice";
import "../pages/AppShell.css";
import "../pages/Auth.css";
import "../pages/Passenger.css";

export default function PublicUserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const activeRole = localStorage.getItem("via-role") || "passenger";

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          api.get(`/api/v1/users/${userId}`),
          api.get(`/api/v1/reviews/user/${userId}`),
        ]);

        if (!mounted) return;

        setProfile(profileRes?.data || null);
        setReviews(reviewsRes?.data || []);
      } catch (err) {
        if (!mounted) return;
        setNotice({
          tone: "error",
          message: err?.body?.message || err.message || "We could not load this public profile.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <AppShell title="Profile" role={activeRole}>
        <div className="auth-spinner" style={{ margin: "40px auto" }} />
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell title="Profile" role={activeRole}>
        <div style={{ padding: 40, textAlign: "center", color: "var(--mist)" }}>User profile not found</div>
      </AppShell>
    );
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "Recently joined";

  return (
    <AppShell title="Public Profile" role={activeRole}>
      <StatusNotice
        tone={notice?.tone}
        message={notice?.message}
        onClose={() => setNotice(null)}
        style={{ marginBottom: notice ? 18 : 0 }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <button className="btn-outline" onClick={() => navigate(-1)} style={{ padding: "10px 16px", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          className="btn-outline"
          onClick={() =>
            setNotice({
              tone: "info",
              message: "User reporting is not connected yet. If this is urgent, contact support or an admin directly.",
            })
          }
          style={{ padding: "10px 16px", display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Flag size={16} />
          Report User
        </button>
      </div>

      <div className="layout-split-grid left-340">
        <div className="info-card sticky-card" style={{ textAlign: "center" }}>
          <div
            style={{
              width: 96,
              height: 96,
              margin: "0 auto 16px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "linear-gradient(135deg, var(--terracotta), var(--gold))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            {profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt={profile.firstName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              profile.firstName?.[0] || <UserRound size={34} />
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--ink)", margin: 0 }}>
              {profile.firstName} {profile.lastName || ""}
            </h2>
            <BadgeCheck size={18} color="var(--forest)" />
          </div>

          <div style={{ color: "var(--mist)", fontSize: "0.9rem", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <MapPin size={14} />
            {profile.role === "driver" ? "Driver" : "Passenger"}
          </div>

          <div className="layout-card-grid-3" style={{ paddingTop: 16, borderTop: "1px solid var(--sand)" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink)", fontWeight: 700 }}>
                <Star size={15} fill="var(--gold)" color="var(--gold)" />
                {(profile.overallRating || 0).toFixed(1)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--mist)", marginTop: 4 }}>Rating</div>
            </div>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink)", fontWeight: 700 }}>
                <Route size={15} />
                {profile.tripsCount || 0}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--mist)", marginTop: 4 }}>Trips</div>
            </div>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink)", fontWeight: 700 }}>
                <CalendarDays size={15} />
                {memberSince}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--mist)", marginTop: 4 }}>Joined</div>
            </div>
          </div>
        </div>

        <div className="layout-stack">
          <div className="info-card">
            <div className="info-card-title">About</div>
            <p style={{ margin: 0, color: "var(--mist)", lineHeight: 1.8 }}>
              {profile.tagline || profile.bio || "This member has not added a public bio yet."}
            </p>
          </div>

          <div className="info-card">
            <div className="info-card-title">Reviews</div>
            {reviews.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--mist)" }}>No reviews yet for this user</div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="ri-header">
                    <div className="ri-av">
                      {review.reviewer?.profilePhoto ? (
                        <img
                          src={review.reviewer.profilePhoto}
                          alt={review.reviewer.firstName}
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                        />
                      ) : (
                        review.reviewer?.firstName?.[0] || "R"
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="ri-name">
                        {review.reviewer?.firstName} {review.reviewer?.lastName || ""}
                      </div>
                      <div className="ri-date">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={`${review._id}-${index}`}
                          size={14}
                          fill={index < review.rating ? "var(--gold)" : "transparent"}
                          color={index < review.rating ? "var(--gold)" : "var(--sand)"}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="ri-comment">{review.comment || "Shared a rating for this ride."}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
