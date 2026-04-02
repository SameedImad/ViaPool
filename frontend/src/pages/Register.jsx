import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Briefcase, CarFront, Star } from "lucide-react";
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

const TESTIMONIAL = {
  text: "Saved Rs.3,200 last month alone. ViaPool made my daily commute from Gachibowli to Secunderabad something I actually look forward to.",
  name: "Ananya M.",
  role: "Passenger - India",
  letter: "A",
};

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("passenger");
  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Enter a valid email";
    if (!form.phone.match(/^\d{10}$/)) e.phone = "Enter a valid 10-digit number";
    if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    if (!agreed) e.agreed = "You must agree to the terms";
    return e;
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await api.post("/api/v1/auth/register", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
      });
      setLoading(false);
      navigate("/login");
    } catch (err) {
      setLoading(false);
      setApiError(err.message || "Registration failed");
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
          <div className="auth-eyebrow">Create account</div>
          <h1 className="auth-title">Join the<br /><em>community.</em></h1>
          <p className="auth-sub">Start sharing rides, split costs, and travel smarter as a driver or a passenger.</p>

          {apiError && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(196,98,45,0.08)", border: "1.5px solid rgba(196,98,45,0.25)", color: "var(--terracotta)", fontSize: "0.88rem", marginBottom: 16 }}>
              {apiError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <span className="auth-label">I want to</span>
              <div className="auth-roles">
                <button type="button" className={`auth-role-btn ${role === "passenger" ? "active" : ""}`} onClick={() => setRole("passenger")}>
                  <Briefcase size={16} /> Find a ride
                </button>
                <button type="button" className={`auth-role-btn ${role === "driver" ? "active" : ""}`} onClick={() => setRole("driver")}>
                  <CarFront size={16} /> Offer rides
                </button>
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label" htmlFor="firstName">First name</label>
                <input id="firstName" className={`auth-input ${errors.firstName ? "error" : ""}`} placeholder="Arjun" value={form.firstName} onChange={set("firstName")} />
                {errors.firstName && <span className="auth-error">{errors.firstName}</span>}
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="lastName">Last name</label>
                <input id="lastName" className={`auth-input ${errors.lastName ? "error" : ""}`} placeholder="Sharma" value={form.lastName} onChange={set("lastName")} />
                {errors.lastName && <span className="auth-error">{errors.lastName}</span>}
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email</label>
              <input id="email" type="email" className={`auth-input ${errors.email ? "error" : ""}`} placeholder="arjun@example.com" value={form.email} onChange={set("email")} />
              {errors.email && <span className="auth-error">{errors.email}</span>}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="phone">Phone number</label>
              <input id="phone" type="tel" className={`auth-input ${errors.phone ? "error" : ""}`} placeholder="9876543210" value={form.phone} onChange={set("phone")} maxLength={10} />
              {errors.phone && <span className="auth-error">{errors.phone}</span>}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <input id="password" type={showPwd ? "text" : "password"} className={`auth-input ${errors.password ? "error" : ""}`} placeholder="Min. 8 characters" value={form.password} onChange={set("password")} />
                <button type="button" className="auth-input-icon" onClick={() => setShowPwd((v) => !v)} aria-label="Toggle password">
                  <EyeIcon open={showPwd} />
                </button>
              </div>
              {errors.password && <span className="auth-error">{errors.password}</span>}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="confirmPassword">Confirm password</label>
              <div className="auth-input-wrap">
                <input id="confirmPassword" type={showCPwd ? "text" : "password"} className={`auth-input ${errors.confirmPassword ? "error" : ""}`} placeholder="Re-enter password" value={form.confirmPassword} onChange={set("confirmPassword")} />
                <button type="button" className="auth-input-icon" onClick={() => setShowCPwd((v) => !v)} aria-label="Toggle confirm password">
                  <EyeIcon open={showCPwd} />
                </button>
              </div>
              {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
            </div>

            <div className="auth-check-row">
              <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <label htmlFor="terms">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
            </div>
            {errors.agreed && <span className="auth-error">{errors.agreed}</span>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-link">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-stripe" />
        <div className="auth-right-stripe-2" />
        <div className="auth-right-content">
          <div className="auth-right-icon">
            <CarFront size={40} />
          </div>
          <h2 className="auth-right-title">Drive or ride,<br /><em>your choice.</em></h2>
          <p className="auth-right-sub">Join 200,000+ commuters across India who are saving money and beating traffic together.</p>
          <div className="auth-right-stats">
            {[
              { num: "2M+", lbl: "Trips completed" },
              null,
              { num: "Rs.4.2k", lbl: "Avg monthly savings" },
              null,
              { num: "4.9", lbl: "Community rating", icon: Star },
            ].map((s, i) =>
              s === null ? <div className="ars-div" key={i} /> : (
                <div className="ars-item" key={s.num}>
                  <div className="ars-num" style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                    {s.num}
                    {s.icon ? <s.icon size={16} /> : null}
                  </div>
                  <div className="ars-lbl">{s.lbl}</div>
                </div>
              )
            )}
          </div>
          <div className="auth-testimonial">
            <div className="at-text">"{TESTIMONIAL.text}"</div>
            <div className="at-author">
              <div className="at-av">{TESTIMONIAL.letter}</div>
              <div>
                <div className="at-name">{TESTIMONIAL.name}</div>
                <div className="at-role">{TESTIMONIAL.role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
