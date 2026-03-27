import { useState, useEffect } from "react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";

const VERIFICATION_STEPS = [
  { label: "Email", status: "verified", icon: "📧" },
  { label: "Phone", status: "verified", icon: "📱" },
  { label: "License", status: "pending", icon: "🪪" },
  { label: "Vehicle", status: "pending", icon: "🚗" },
];

const STATUS_MAP = {
  verified: { cls: "badge-verified", text: "Verified", dot: "✓" },
  pending: { cls: "badge-pending", text: "Under Review", dot: "⏳" },
  rejected: { cls: "badge-rejected", text: "Action Needed", dot: "!" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status];
  return (
    <span className={`badge ${s.cls}`}>
      {s.dot} {s.text}
    </span>
  );
}

export default function Profile() {
  const [tab, setTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/v1/auth/current-user");
        const user = res?.data?.data || {};

        setForm({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          bio: user.bio || "",
          tagline: user.tagline || "",
        });
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    fetchUser();
  }, []);

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

  if (!form) return <div>Loading...</div>;

  return (
    <AppShell title="My Profile" role="driver" unreadCount={3}>
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
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Avatar card */}
          <div className="info-card" style={{ textAlign: "center" }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--terracotta), var(--gold))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.2rem",
                fontWeight: 700,
                color: "#fff",
                margin: "0 auto 16px",
              }}
            >
              A
            </div>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.15rem",
                color: "var(--ink)",
                marginBottom: 4,
              }}
            >
              {form.firstName} {form.lastName}
            </div>
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--mist)",
                marginBottom: 16,
              }}
            >
              Driver · Hyderabad
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
                { n: "24", l: "Trips" },
                { n: "4.9", l: "Rating" },
                { n: "₹12k", l: "Earned" },
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
                  <div style={{ fontSize: "0.7rem", color: "var(--mist)" }}>
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
              <div className="info-card-title" style={{ margin: 0 }}>
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
                { label: "First name", key: "firstName" },
                { label: "Last name", key: "lastName" },
                { label: "Email", key: "email" },
                { label: "Phone", key: "phone" },
              ].map(({ label, key }) => (
                <div key={key} className="auth-field">
                  <label className="auth-label">{label}</label>
                  <input
                    className="auth-input"
                    value={form[key]}
                    onChange={set(key)}
                    disabled={!editing}
                    style={{
                      background: editing ? "var(--parchment)" : "transparent",
                      cursor: editing ? "text" : "default",
                    }}
                  />
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
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 640,
          }}
        >
          <div className="info-card" style={{ marginBottom: 8 }}>
            <div className="info-card-title">Document Verification Status</div>
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
                  <span style={{ fontSize: "1.4rem" }}>{step.icon}</span>
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
