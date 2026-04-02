import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import "../pages/AppShell.css";
import "../pages/Auth.css";
import "../pages/Driver.css";

const STEPS = [
  { n: 1, label: "Personal" },
  { n: 2, label: "License" },
  { n: 3, label: "Vehicle" },
  { n: 4, label: "Done" },
];

function Stepper({ current }) {
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div className="step-item" key={s.n}>
          <div className="step-wrap">
            <div className={`step-circle ${current === s.n ? "active" : current > s.n ? "done" : ""}`}>
              {current > s.n ? "OK" : s.n}
            </div>
            <div className={`step-label ${current === s.n ? "active" : current > s.n ? "done" : ""}`}>
              {s.label}
            </div>
          </div>
          {i < STEPS.length - 1 && <div className={`step-connector ${current > s.n ? "done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

function UploadZone({ label, hint, uploaded, onUpload }) {
  const handleDrop = (e) => {
    e.preventDefault();
    onUpload(e.dataTransfer.files[0] || null);
  };

  return (
    <div
      className={`file-zone ${uploaded ? "uploaded" : ""}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => {
        const el = document.createElement("input");
        el.type = "file";
        el.accept = "image/*,.pdf";
        el.onchange = (ev) => onUpload(ev.target.files[0] || null);
        el.click();
      }}
    >
      <div className="fz-icon">{uploaded ? "OK" : "FILE"}</div>
      <div className="fz-text">
        {uploaded ? (
          <>
            <strong style={{ color: "var(--forest)" }}>{uploaded}</strong>
            <br />
            <span>Uploaded successfully</span>
          </>
        ) : (
          <>
            <strong>{label}</strong>
            <br />
            {hint}
          </>
        )}
      </div>
    </div>
  );
}

export default function DriverOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [personal, setPersonal] = useState({ dob: "", gender: "" });
  const [license, setLicense] = useState({
    front: "",
    frontFile: null,
    back: "",
    backFile: null,
    expiry: "",
    number: "",
  });
  const [vehicle, setVehicle] = useState({
    make: "",
    model: "",
    year: "",
    plate: "",
    type: "Sedan",
    photo: "",
    photoFile: null,
  });

  const next = async () => {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("licenseNumber", license.number || "LIC_DEFAULT");
    formData.append("brand", vehicle.make);
    formData.append("model", vehicle.model);
    formData.append("year", vehicle.year);
    formData.append("registrationNumber", vehicle.plate);
    formData.append("totalSeats", vehicle.type === "SUV" || vehicle.type === "MUV" ? 7 : 4);

    if (license.frontFile) formData.append("licenseImage", license.frontFile);
    if (vehicle.photoFile) formData.append("vehiclePhoto", vehicle.photoFile);

    try {
      await api.post("/api/v1/auth/setup-driver", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      try {
        const currentUser = JSON.parse(localStorage.getItem("via-user") || "{}");
        localStorage.setItem("via-user", JSON.stringify({ ...currentUser, role: "driver" }));
        localStorage.setItem("via-role", "driver");
      } catch (storageError) {
        console.error("Failed to persist driver role locally", storageError);
      }

      setStep(4);
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !personal.dob || !personal.gender;
    if (step === 2) return !license.expiry || !license.number;
    if (step === 3) return !vehicle.make || !vehicle.model || !vehicle.plate;
    return false;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", padding: "40px 24px" }}>
      <a
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          marginBottom: 40,
          justifyContent: "center",
          fontFamily: "var(--font-serif)",
          fontSize: "1.3rem",
          color: "var(--ink)",
        }}
      >
        <span className="logo-pill">VP</span> ViaPool
      </a>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Stepper current={step} />

        {step === 1 && (
          <div className="onboard-card">
            <div className="onboard-card-title">
              Personal <em>details</em>
            </div>
            <p className="onboard-card-sub">We need a few details to create your verified driver profile.</p>
            <div className="auth-form" style={{ gap: 16 }}>
              <div className="auth-field">
                <label className="auth-label">Date of birth</label>
                <input
                  type="date"
                  className="auth-input"
                  value={personal.dob}
                  onChange={(e) => setPersonal((p) => ({ ...p, dob: e.target.value }))}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Gender</label>
                <select
                  className="auth-input"
                  value={personal.gender}
                  onChange={(e) => setPersonal((p) => ({ ...p, gender: e.target.value }))}
                  style={{ cursor: "pointer" }}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other / Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboard-card">
            <div className="onboard-card-title">
              Driving <em>license</em>
            </div>
            <p className="onboard-card-sub">
              Uploads are optional while testing locally. Add files if you want, or continue with the license details only.
            </p>
            <div className="auth-field" style={{ marginBottom: 16 }}>
              <label className="auth-label">License Number</label>
              <input
                className="auth-input"
                placeholder="ABC1234567"
                value={license.number}
                onChange={(e) => setLicense((p) => ({ ...p, number: e.target.value.toUpperCase() }))}
              />
            </div>
            <UploadZone
              label="License Front Side (optional)"
              hint="Drag or click to upload"
              uploaded={license.front}
              onUpload={(file) => setLicense((p) => ({ ...p, front: file?.name || "", frontFile: file || null }))}
            />
            <UploadZone
              label="License Back Side (optional)"
              hint="Drag or click to upload"
              uploaded={license.back}
              onUpload={(file) => setLicense((p) => ({ ...p, back: file?.name || "", backFile: file || null }))}
            />
            <div className="auth-field" style={{ marginTop: 8 }}>
              <label className="auth-label">License expiry date</label>
              <input
                type="date"
                className="auth-input"
                value={license.expiry}
                onChange={(e) => setLicense((p) => ({ ...p, expiry: e.target.value }))}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboard-card">
            <div className="onboard-card-title">
              Your <em>vehicle</em>
            </div>
            <p className="onboard-card-sub">Register the car you'll use for rides. You can add more vehicles later.</p>
            <div className="auth-form" style={{ gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="auth-field">
                  <label className="auth-label">Make (Brand)</label>
                  <input
                    className="auth-input"
                    placeholder="Honda"
                    value={vehicle.make}
                    onChange={(e) => setVehicle((p) => ({ ...p, make: e.target.value }))}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Model</label>
                  <input
                    className="auth-input"
                    placeholder="City"
                    value={vehicle.model}
                    onChange={(e) => setVehicle((p) => ({ ...p, model: e.target.value }))}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Year</label>
                  <input
                    className="auth-input"
                    placeholder="2022"
                    value={vehicle.year}
                    onChange={(e) => setVehicle((p) => ({ ...p, year: e.target.value }))}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Type</label>
                  <select
                    className="auth-input"
                    value={vehicle.type}
                    onChange={(e) => setVehicle((p) => ({ ...p, type: e.target.value }))}
                    style={{ cursor: "pointer" }}
                  >
                    {["Sedan", "SUV", "Hatchback", "MUV", "Electric"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Registration plate</label>
                <input
                  className="auth-input"
                  placeholder="TS 09 AB 1234"
                  value={vehicle.plate}
                  onChange={(e) => setVehicle((p) => ({ ...p, plate: e.target.value.toUpperCase() }))}
                  style={{ fontFamily: "var(--font-mono)", letterSpacing: 2 }}
                />
              </div>
              <UploadZone
                label="Vehicle photo (optional)"
                hint="Dashboard photo, exterior, etc."
                uploaded={vehicle.photo}
                onUpload={(file) => setVehicle((p) => ({ ...p, photo: file?.name || "", photoFile: file || null }))}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="onboard-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: 20 }}>Done</div>
            <div className="onboard-card-title">
              You're <em>all set!</em>
            </div>
            <p className="onboard-card-sub">
              Your profile has been created. You can explore the dashboard now and add files later if needed.
            </p>
            <button className="auth-submit" style={{ marginTop: 8 }} onClick={() => navigate("/driver/dashboard")}>
              Go to Dashboard
            </button>
          </div>
        )}

        {step < 4 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 24,
              maxWidth: 560,
              margin: "24px auto 0",
            }}
          >
            {step > 1 ? (
              <button className="btn-outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              className="auth-submit"
              style={{ width: "auto", padding: "14px 36px" }}
              onClick={next}
              disabled={isNextDisabled() || loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Submitting...
                </>
              ) : step === 3 ? (
                "Submit"
              ) : (
                "Continue"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
