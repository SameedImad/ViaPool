import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Car, 
  Award,
  TrendingUp,
  MapPin,
  CheckCircle, 
  Clock,
  AlertCircle,
  FileText
} from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";

const VERIFICATION_STEPS = [
  { label: "Email", status: "verified", icon: Mail },
  { label: "Phone", status: "verified", icon: Phone },
  { label: "License", status: "pending", icon: FileText },
  { label: "Vehicle", status: "pending", icon: Car },
];

const STATUS_MAP = {
  verified: { cls: "badge-verified", text: "Verified", icon: CheckCircle },
  pending: { cls: "badge-pending", text: "Under Review", icon: Clock },
  rejected: { cls: "badge-rejected", text: "Action Needed", icon: AlertCircle },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status];
  const Icon = s.icon;
  return (
    <span className={`badge ${s.cls}`}>
      <Icon size={12} style={{marginRight: 4}} /> {s.text}
    </span>
  );
}

export default function Profile() {
  const location = useLocation();
  const [tab, setTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ trips: "0", rating: "0.0", earned: "₹0" });

  const activeRole = localStorage.getItem("via-role") || "passenger";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/v1/auth/current-user");
        const u = res?.data || {};
        setUser(u);
        setForm({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
          phone: u.phone || "",
          bio: u.bio || "",
          tagline: u.tagline || "",
        });

        // Mocking stats for now based on user data, or we could fetch from a real stats endpoint
        setStats({
            trips: u.tripsCount || "0",
            rating: u.overallRating?.toFixed(1) || "0.0",
            earned: activeRole === "driver" ? `₹${(u.totalEarnings || 0).toLocaleString()}` : "N/A"
        });
      } catch (err) {
        console.error("Failed to fetch user", err);
        // Set an empty form to stop the spinner if the user is authenticated but fetch fails
        setForm({ firstName: "", lastName: "", email: "", phone: "", bio: "", tagline: "" });
      }
    };

    fetchUser();
  }, [location.key, activeRole]);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    try {
      await api.patch("/api/v1/auth/update-profile", form);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  if (!form) return <div className="auth-spinner" style={{margin: '100px auto'}} />;

  return (
    <AppShell title="My Profile" role={activeRole}>
      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-eyebrow">Account</div>
        <h1 className="page-header-title">
          My <em>Profile</em>
        </h1>
        <p className="page-header-sub">
          Manage your personal information and document verification status.
        </p>
      </div>

      {/* ── TABS ── */}
      <div className="tab-bar">
        {["info", "verification"].map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "info" ? "My Info" : "Verification Status"}
          </button>
        ))}
      </div>

      {tab === "info" ? (
        <div
          className="profile-grid-container"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Avatar card */}
          <div className="info-card" style={{ textAlign: "center" }}>
            <div className="profile-av-container"
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: user?.profilePhoto ? "none" : "linear-gradient(135deg, var(--terracotta), var(--gold))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.2rem",
                fontWeight: 700,
                color: "#fff",
                margin: "0 auto 16px",
                overflow: 'hidden'
              }}
            >
              {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Me" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                  user?.firstName?.[0] || "U"
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.25rem",
                color: "var(--ink)",
                marginBottom: 4,
              }}
            >
              {form.firstName} {form.lastName}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--mist)",
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <MapPin size={14} /> {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} · Hyderabad
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 20,
                paddingTop: 16,
                borderTop: "1px solid var(--sand)",
              }}
            >
              {[
                { n: stats.trips, l: "Trips", icon: Award },
                { n: stats.rating, l: "Rating", icon: Award },
                { n: stats.earned, l: "Earned", icon: TrendingUp },
              ].map((s) => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "1.3rem",
                      color: "var(--ink)",
                    }}
                  >
                    {s.n}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--mist)", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info form */}
          <div className="info-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div className="info-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <User size={20} color="var(--terracotta)" />
                Personal Information
              </div>
              {saved && (
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--forest)",
                    fontWeight: 600,
                  }}
                >
                  ✓ Saved
                </span>
              )}
              <button
                onClick={() => (editing ? handleSave() : setEditing(true))}
                className={editing ? "btn-primary" : "btn-outline"}
                style={{ padding: "8px 20px", fontSize: "0.85rem" }}
              >
                {editing ? "Save changes" : "Edit profile"}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {[
                { label: "First name", key: "firstName", icon: User },
                { label: "Last name", key: "lastName", icon: User },
                { label: "Email", key: "email", icon: Mail },
                { label: "Phone", key: "phone", icon: Phone },
              ].map(({ label, key, icon: Icon }) => (
                <div key={key} className="auth-field">
                  <label className="auth-label">{label}</label>
                  <div style={{position: 'relative'}}>
                      <input
                        className="auth-input"
                        value={form[key]}
                        onChange={set(key)}
                        disabled={!editing}
                        style={{
                          background: editing ? "var(--parchment)" : "transparent",
                          cursor: editing ? "text" : "default",
                          paddingLeft: 40
                        }}
                      />
                      <Icon size={16} style={{position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4}} />
                  </div>
                </div>
              ))}
              <div className="auth-field" style={{ gridColumn: "span 2" }}>
                <label className="auth-label">Short bio</label>
                <textarea
                  className="auth-input"
                  value={form.bio}
                  onChange={set("bio")}
                  disabled={!editing}
                  rows={3}
                  style={{
                    resize: "vertical",
                    background: editing ? "var(--parchment)" : "transparent",
                    cursor: editing ? "text" : "default",
                  }}
                />
              </div>
              <div className="auth-field" style={{ gridColumn: "span 2" }}>
                <label className="auth-label">Tagline (Profile headline)</label>
                <input
                  className="auth-input"
                  value={form.tagline}
                  onChange={set("tagline")}
                  disabled={!editing}
                  placeholder="e.g. Always on time, loves jazz music"
                  style={{
                    background: editing ? "var(--parchment)" : "transparent",
                    cursor: editing ? "text" : "default",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Verification tab */
        <div
          className="verification-container"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 640,
          }}
        >
          <div className="info-card" style={{ marginBottom: 8 }}>
            <div className="info-card-title" style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <ShieldCheck size={20} color="var(--forest)" />
                Document Verification Status
            </div>
            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--mist)",
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              Verification is reviewed manually and usually takes 24–48 hours.
              You need at least your vehicle verified to post rides.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {VERIFICATION_STEPS.map((step) => (
                <div
                  key={step.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    borderRadius: 14,
                    background: "var(--cream)",
                    border: "1px solid var(--sand)",
                  }}
                >
                  <span style={{ fontSize: "1.4rem", color: 'var(--ink)', opacity: 0.7 }}>
                      <step.icon size={24} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.92rem",
                        color: "var(--ink)",
                      }}
                    >
                      {step.label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--mist)",
                        marginTop: 2,
                      }}
                    >
                      {step.status === "verified"
                        ? "Your document has been approved."
                        : "Uploaded · awaiting admin review"}
                    </div>
                  </div>
                  <StatusBadge status={step.status} />
                  {step.status !== "verified" && (
                    <button
                      className="btn-outline"
                      style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                    >
                      Re-upload
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
