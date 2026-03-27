import api from "../lib/api";

// Sample reviews removed, now fetching from backend

function Stars({ n }) {
  return (
    <span style={{ color: "#C9A84C", letterSpacing: 2 }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

export default function PublicUserProfile() {
  const { userId } = useParams();
  const [reported, setReported] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    const fetchData = async () => {
      try {
        const [userRes, reviewRes] = await Promise.all([
          api.get(`/api/v1/users/${userId}`),
          api.get(`/api/v1/reviews/user/${userId}`)
        ]);
        
        const u = userRes.data;
        setUser({
          name: `${u.firstName} ${u.lastName}`,
          letter: u.firstName[0],
          role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
          joined: new Date(u.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' }),
          rating: u.overallRating || 0,
          trips: u.tripsCount || 0,
          bio: u.bio || "No bio added yet.",
          isVerified: u.drivingLicense?.isVerified || false,
        });

        setReviews(reviewRes.data.map(r => ({
          id: r._id,
          from: `${r.reviewer?.firstName} ${r.reviewer?.lastName?.[0]}.`,
          letter: r.reviewer?.firstName[0],
          rating: r.rating,
          comment: r.comment,
          date: new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
          role: r.reviewer?.role.charAt(0).toUpperCase() + r.reviewer?.role.slice(1)
        })));

      } catch (err) {
        console.error("Failed to fetch public profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleReport = () => {
    if (!reportReason) return;
    setReported(true);
    setShowReport(false);
  };

  if (loading) return <AppShell title="Loading..." unreadCount={0}><div className="auth-spinner" style={{margin: "40px auto"}}></div></AppShell>;
  if (!user) return <AppShell title="Not Found" unreadCount={0}><div style={{padding: 40, textAlign: 'center'}}>User not found</div></AppShell>;

  return (
    <AppShell title="User Profile" unreadCount={3}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* ── Profile card ── */}
        <div className="info-card" style={{ marginBottom: 24, display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--terracotta), var(--gold))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.2rem", fontWeight: 700, color: "#fff",
          }}>{user.letter}</div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {user.name}
              </h1>
              {user.isVerified && <span className="badge badge-verified">✓ Verified {user.role}</span>}
            </div>
            <div style={{ fontSize: "0.88rem", color: "var(--mist)", marginBottom: 12 }}>
              {user.role} · Member since {user.joined}
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--mist)", lineHeight: 1.65, marginBottom: 20 }}>{user.bio}</p>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 28, paddingTop: 16, borderTop: "1px solid var(--sand)", flexWrap: "wrap" }}>
              {[
                { n: (user.rating ? user.rating.toFixed(1) : "0.0") + "★", l: "Avg rating" },
                { n: user.trips,        l: "Trips" },
                { n: reviews.length, l: "Reviews" },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--ink)" }}>{s.n}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--mist)" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Report button */}
          <div>
            {!reported ? (
              <button
                onClick={() => setShowReport(true)}
                style={{
                  padding: "8px 16px", borderRadius: 10, border: "1.5px solid var(--sand)",
                  background: "transparent", fontSize: "0.82rem", color: "var(--mist)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.target.style.borderColor = "var(--terracotta)"; e.target.style.color = "var(--terracotta)"; }}
                onMouseLeave={e => { e.target.style.borderColor = "var(--sand)";       e.target.style.color = "var(--mist)"; }}
              >
                🚩 Report User
              </button>
            ) : (
              <span className="badge badge-pending">Report submitted</span>
            )}
          </div>
        </div>

        {/* ── Report modal ── */}
        {showReport && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
            <div style={{ background: "var(--cream)", borderRadius: 20, padding: 32, maxWidth: 440, width: "100%" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--ink)", marginBottom: 8 }}>Report User</h2>
              <p style={{ fontSize: "0.88rem", color: "var(--mist)", marginBottom: 20, lineHeight: 1.6 }}>
                Tell us what's wrong. We review all reports within 24 hours.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {["Inappropriate behavior", "Fake profile", "Payment dispute", "Safety concern", "Other"].map(r => (
                  <label key={r} style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", fontSize: "0.9rem" }}>
                    <input type="radio" name="reason" value={r} onChange={() => setReportReason(r)} style={{ accentColor: "var(--terracotta)" }} />
                    {r}
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-outline" onClick={() => setShowReport(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn-primary" onClick={handleReport} disabled={!reportReason} style={{ flex: 1 }}>Submit Report</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        <div className="info-card">
          <div className="info-card-title">Reviews ({reviews.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reviews.length === 0 ? (
               <div style={{ color: "var(--mist)", fontSize: "0.9rem", textAlign: "center", padding: "20px 0" }}>No reviews yet</div>
            ) : reviews.map(r => (
              <div key={r.id} style={{ paddingBottom: 16, borderBottom: "1px solid var(--sand)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "var(--parchment)", border: "1px solid var(--sand)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.85rem", color: "var(--mist)",
                  }}>{r.letter}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>{r.from}</span>
                        <span style={{ fontSize: "0.76rem", color: "var(--mist)", marginLeft: 8 }}>{r.role}</span>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--mist)" }}>{r.date}</span>
                    </div>
                    <Stars n={r.rating} />
                    <p style={{ fontSize: "0.86rem", color: "var(--mist)", marginTop: 6, lineHeight: 1.6 }}>{r.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
