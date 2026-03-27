import { useState, useEffect } from "react";
import AppShell from "../components/AppShell";
import api from "../lib/api";
import "../pages/AppShell.css";

export default function Settings() {
  const [toggles, setToggles] = useState({ twoFa: true, showPhone: false, autoAccept: false });
  const [modal, setModal]     = useState(null); // { id, label }
  const [confirmed, setConfirmed] = useState("");
  const [user, setUser] = useState(null);
  const [editValue, setEditValue] = useState("");

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/v1/auth/current-user");
      setUser(res?.data?.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const SECTIONS = [
    {
      title: "Account",
      items: [
        { id: "email",   label: "Email address",    sub: user?.email || "Loading...",   action: "Change" },
        { id: "phone",   label: "Phone number",     sub: user?.phone || "Not set",       action: "Change" },
        { id: "bio",     label: "Bio",              sub: user?.bio || "No bio added",    action: "Change" },
        { id: "tagline", label: "Tagline",          sub: user?.tagline || "No tagline",  action: "Change" },
        { id: "password",label: "Password",         sub: "********",             action: "Change" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { id: "lang",  label: "Language",           sub: "English",              action: "Change" },
        { id: "curr",  label: "Currency",            sub: "INR (₹)",             action: "Change" },
      ],
    },
    {
      title: "Privacy",
      items: [
        { id: "location",label: "Location access",  sub: "Allow only while using app", action: "Manage" },
        { id: "data",    label: "Data & analytics", sub: "Help improve ViaPool",  action: "Manage" },
      ],
    },
    {
      title: "Danger Zone",
      danger: true,
      items: [
        { id: "deactivate", label: "Deactivate account", sub: "Temporarily pause your profile", action: "Deactivate" },
        { id: "delete",     label: "Delete account",     sub: "Permanently remove all your data", action: "Delete" },
      ],
    },
  ];

  const Toggle = ({ k }) => (
    <label style={{ position: "relative", width: 44, height: 24, flexShrink: 0, cursor: "pointer" }}>
      <input type="checkbox" checked={toggles[k]} onChange={e => setToggles(p => ({ ...p, [k]: e.target.checked }))} style={{ display: "none" }} />
      <div style={{ width: 44, height: 24, borderRadius: 12, background: toggles[k] ? "var(--forest)" : "var(--sand)", transition: "background 0.25s", position: "relative" }}>
        <div style={{ position: "absolute", top: 4, left: toggles[k] ? 23 : 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
      </div>
    </label>
  );

  const handleUpdate = async () => {
    try {
      if (modal.id === "delete") {
         // Handle delete...
         return;
      }
      
      const payload = { [modal.id]: editValue };
      await api.patch("/api/v1/auth/update-profile", payload);
      await fetchUser();
      setModal(null);
      setEditValue("");
    } catch (err) {
      alert("Failed to update: " + err.message);
    }
  };

  const TOGGLE_PREFS = [
    { key: "twoFa", label: "Two-factor Authentication", sub: "Add an extra layer of security to your account." },
    { key: "showPhone", label: "Show phone number", sub: "Visible to other users during an active ride." },
    { key: "autoAccept", label: "Auto-accept bookings", sub: "Instantly confirm ride requests from passengers." },
  ];

  return (
    <AppShell title="Settings" unreadCount={3}>
      <div className="page-header">
        <div className="page-header-eyebrow">Account</div>
        <h1 className="page-header-title">Settings</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start", maxWidth: 960 }}>
        {/* ── Main settings ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {SECTIONS.map(section => (
            <div key={section.title} className="info-card">
              <div style={{
                fontFamily: "var(--font-serif)", fontSize: "1rem", color: section.danger ? "var(--terracotta)" : "var(--ink)",
                marginBottom: 16,
              }}>{section.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {section.items.map((item, i) => (
                  <div key={item.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
                    padding: "14px 0",
                    borderTop: i > 0 ? "1px solid var(--sand)" : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: section.danger ? "var(--terracotta)" : "var(--ink)" }}>{item.label}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--mist)", marginTop: 2 }}>{item.sub}</div>
                    </div>
                    <button
                      onClick={() => setModal(item)}
                      style={{
                        padding: "7px 16px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600,
                        border: section.danger ? "1.5px solid rgba(196,98,45,0.3)" : "1.5px solid var(--sand)",
                        background: "transparent",
                        color: section.danger ? "var(--terracotta)" : "var(--ink)",
                        cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
                      }}
                    >{item.action}</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick toggles ── */}
        <div className="info-card" style={{ position: "sticky", top: 80 }}>
          <div className="info-card-title">Security & Privacy</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {TOGGLE_PREFS.map(item => (
              <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--mist)", lineHeight: 1.5 }}>{item.sub}</div>
                </div>
                <Toggle k={item.key} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--sand)", fontSize: "0.8rem", color: "var(--mist)", lineHeight: 1.6 }}>
            ViaPool v1.0.0 · <a href="#" style={{ color: "var(--terracotta)", textDecoration: "none" }}>Privacy Policy</a> · <a href="#" style={{ color: "var(--terracotta)", textDecoration: "none" }}>Terms</a>
          </div>
        </div>
      </div>

      {/* ── Simple modal for "Change" / "Delete" actions ── */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--cream)", borderRadius: 20, padding: 32, maxWidth: 420, width: "100%" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--ink)", marginBottom: 8 }}>{modal.label}</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--mist)", marginBottom: 20, lineHeight: 1.6 }}>
              {modal.id === "delete"
                ? "This action is permanent and cannot be undone. Type DELETE to confirm."
                : `This will let you update your ${modal.label.toLowerCase()}. This feature connects to the API.`}
            </p>
            {modal.id === "delete" ? (
              <input
                className="auth-input"
                placeholder="Type DELETE to confirm"
                value={confirmed}
                onChange={e => setConfirmed(e.target.value)}
                style={{ marginBottom: 16 }}
              />
            ) : (
              <div className="auth-field">
                <label className="auth-label">New {modal.label}</label>
                <input
                  className="auth-input"
                  placeholder={`Enter new ${modal.label.toLowerCase()}`}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  style={{ marginBottom: 16 }}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-outline" onClick={() => { setModal(null); setConfirmed(""); setEditValue(""); }} style={{ flex: 1 }}>Cancel</button>
              <button
                className="btn-primary"
                disabled={(modal.id === "delete" && confirmed !== "DELETE") || (modal.id !== "delete" && !editValue.trim())}
                style={{ flex: 1, background: ["delete", "deactivate"].includes(modal.id) ? "var(--terracotta)" : undefined }}
                onClick={handleUpdate}
              >
                {modal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
