import { useNavigate } from "react-router-dom";
import "../pages/Passenger.css";

export default function Forbidden() {
  const navigate = useNavigate();
  return (
    <div className="error-page">
      <div className="error-code">403</div>
      <div className="error-emoji">🔒</div>
      <h1 className="error-title">Access Denied</h1>
      <p className="error-sub">
        You don't have permission to view this page. Please sign in with the correct account or contact support if you think this is a mistake.
      </p>
      <div className="error-actions">
        <button className="btn-primary" onClick={() => navigate("/login")}>Sign In →</button>
        <button className="btn-secondary" onClick={() => navigate("/")}>Go Home</button>
      </div>

      {/* decorative */}
      <div style={{ marginTop: 56, display: "flex", gap: 16, opacity: 0.2 }}>
        {["🔐","🛡️","🚫","🔑","⛔"].map((e, i) => (
          <span key={i} style={{ fontSize: "1.8rem", animation: `float ${2 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.25}s` }}>{e}</span>
        ))}
      </div>
    </div>
  );
}
