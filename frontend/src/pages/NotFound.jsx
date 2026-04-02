import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Car, Compass, Map, MapPin, Route } from "lucide-react";
import "../pages/Passenger.css";

const DECORATIVE_ICONS = [Car, Route, MapPin, Compass, Map];

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div className="error-code">404</div>
      <div className="error-emoji">
        <Map size={56} strokeWidth={1.75} />
      </div>
      <h1 className="error-title">Page not found</h1>
      <p className="error-sub">
        Looks like you've taken a wrong turn. The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="error-actions">
        <button className="btn-primary" onClick={() => navigate("/")}>
          Go Home <ArrowRight size={16} />
        </button>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Go Back
        </button>
        <button className="btn-outline" onClick={() => navigate("/search")}>Find a Ride</button>
      </div>

      <div style={{ marginTop: 56, display: "flex", gap: 16, opacity: 0.25 }}>
        {DECORATIVE_ICONS.map((Icon, i) => (
          <span
            key={i}
            style={{
              fontSize: "1.8rem",
              animation: `float ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          >
            <Icon size={28} strokeWidth={1.75} />
          </span>
        ))}
      </div>
    </div>
  );
}
