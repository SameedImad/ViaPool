import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock3, Lock, Mail, ShieldCheck } from "lucide-react";
import api from "../lib/api";
import "./Auth.css";

const CHECK_ICON = (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SECURITY_ITEMS = [
  { Icon: Lock, t: "End-to-end encrypted", d: "All data in transit is protected with TLS 1.3" },
  { Icon: Clock3, t: "Links expire in 15 min", d: "One-time use reset links for maximum security" },
  { Icon: Mail, t: "Verified email only", d: "Reset links are only sent to your registered address" },
];

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/auth/forgot-password", { email });
      setLoading(false);
      setSent(true);
    } catch (err) {
      setLoading(false);
      setError(err.body?.message || err.message || "Failed to send reset link");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <Link to="/" className="auth-logo">
          <span className="logo-pill">VP</span>
          ViaPool
        </Link>

        <div className="auth-form-wrap">
          {!sent ? (
            <>
              <div className="auth-eyebrow">Password reset</div>
              <h1 className="auth-title">Forgot your<br /><em>password?</em></h1>
              <p className="auth-sub">No worries. Enter your email and we'll send a reset link to your inbox.</p>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    className={`auth-input ${error ? "error" : ""}`}
                    placeholder="arjun@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    autoComplete="email"
                  />
                  {error && <span className="auth-error">{error}</span>}
                </div>

                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="auth-spinner" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      Send reset link <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 24 }}>
              <div style={{ width: 90, height: 90, borderRadius: "50%", background: "rgba(45,74,53,0.1)", border: "2px solid var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", color: "var(--forest)" }}>
                {CHECK_ICON}
              </div>
              <h1 className="auth-title" style={{ marginBottom: 12 }}>Check your<br /><em>inbox.</em></h1>
              <p className="auth-sub">
                We've sent a password reset link to <strong style={{ color: "var(--ink)" }}>{email}</strong>.
                The link expires in 15 minutes.
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--mist)", marginTop: 20, lineHeight: 1.6 }}>
                Didn't receive it? Check spam, or{" "}
                <button onClick={() => setSent(false)} style={{ background: "none", border: "none", color: "var(--terracotta)", fontWeight: 600, cursor: "pointer", fontSize: "inherit", padding: 0 }}>
                  try again
                </button>.
              </p>
            </div>
          )}

          <p className="auth-footer-link" style={{ marginTop: sent ? 32 : 20 }}>
            <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ArrowLeft size={16} /> Back to sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-stripe" />
        <div className="auth-right-stripe-2" />
        <div className="auth-right-content">
          <div className="auth-right-icon">
            <ShieldCheck size={40} />
          </div>
          <h2 className="auth-right-title">Your security<br /><em>matters to us.</em></h2>
          <p className="auth-right-sub">Reset links expire in 15 minutes and can only be used once. Your password is encrypted and never stored in plain text.</p>

          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
            {SECURITY_ITEMS.map((item) => (
              <div key={item.t} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 18px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <item.Icon size={20} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--cream)", marginBottom: 3 }}>{item.t}</div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.4)", lineHeight: 1.5 }}>{item.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
