import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CaseSensitive, Hash, Lock, Sparkles } from "lucide-react";
import api from "../lib/api";
import "./Auth.css";

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CHECK_ICON = (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const PASSWORD_TIPS = [
  { Icon: CaseSensitive, t: "At least 8 characters", d: "Longer passwords are harder to crack" },
  { Icon: Hash, t: "Mix letters and numbers", d: "Combine uppercase, lowercase, and digits" },
  { Icon: Sparkles, t: "Add a special character", d: "Use symbols like !, @, # or $" },
];

function PasswordStrength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#C4622D", "#C9A84C", "#4A6B52", "#2D4A35"];

  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= score ? colors[score] : "var(--sand)", transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ fontSize: "0.75rem", color: colors[score], marginTop: 4, fontWeight: 600 }}>{labels[score]}</div>
    </div>
  );
}

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <Link to="/" className="auth-logo"><span className="logo-pill">VP</span>ViaPool</Link>
          <div className="auth-form-wrap" style={{ textAlign: "center" }}>
            <h1 className="auth-title" style={{ marginBottom: 16 }}>Invalid<br /><em>link.</em></h1>
            <p className="auth-sub">This reset link is invalid or has expired. Please request a new one.</p>
            <Link to="/forgot-password" style={{ display: "inline-block", marginTop: 24 }}>
              <button className="auth-submit" style={{ width: "auto", padding: "14px 32px" }}>
                Request new link <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
        <div className="auth-right"><div className="auth-right-stripe" /><div className="auth-right-stripe-2" /></div>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    return e;
  };

  const set = (field) => (ev) => setForm((f) => ({ ...f, [field]: ev.target.value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await api.post("/api/v1/auth/reset-password", { token, password: form.password });
      setLoading(false);
      setDone(true);
    } catch (err) {
      setLoading(false);
      setErrors({ password: err.body?.message || err.message || "Failed to reset password" });
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
          {!done ? (
            <>
              <div className="auth-eyebrow">New password</div>
              <h1 className="auth-title">Reset your<br /><em>password.</em></h1>
              <p className="auth-sub">Choose a strong password. You'll use it to sign in from now on.</p>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="password">New password</label>
                  <div className="auth-input-wrap">
                    <input id="password" type={showPwd ? "text" : "password"} className={`auth-input ${errors.password ? "error" : ""}`} placeholder="Min. 8 characters" value={form.password} onChange={set("password")} />
                    <button type="button" className="auth-input-icon" onClick={() => setShowPwd((v) => !v)} aria-label="Toggle">
                      <EyeIcon open={showPwd} />
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                  {errors.password && <span className="auth-error">{errors.password}</span>}
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="confirmPassword">Confirm new password</label>
                  <div className="auth-input-wrap">
                    <input id="confirmPassword" type={showCPwd ? "text" : "password"} className={`auth-input ${errors.confirmPassword ? "error" : ""}`} placeholder="Re-enter password" value={form.confirmPassword} onChange={set("confirmPassword")} />
                    <button type="button" className="auth-input-icon" onClick={() => setShowCPwd((v) => !v)} aria-label="Toggle">
                      <EyeIcon open={showCPwd} />
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
                </div>

                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="auth-spinner" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Set new password <ArrowRight size={16} />
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
              <h1 className="auth-title" style={{ marginBottom: 12 }}>Password<br /><em>updated!</em></h1>
              <p className="auth-sub">Your password has been reset successfully. You can now sign in with your new password.</p>
              <button className="auth-submit" style={{ marginTop: 28 }} onClick={() => navigate("/login")}>
                Sign in <ArrowRight size={16} />
              </button>
            </div>
          )}

          {!done && (
            <p className="auth-footer-link">
              <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ArrowLeft size={16} /> Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-stripe" />
        <div className="auth-right-stripe-2" />
        <div className="auth-right-content">
          <div className="auth-right-icon">
            <Lock size={40} />
          </div>
          <h2 className="auth-right-title">Choose a<br /><em>strong password.</em></h2>
          <p className="auth-right-sub">A strong password keeps your rides, payments, and personal data secure.</p>
          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
            {PASSWORD_TIPS.map((item) => (
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
