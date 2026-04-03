import { useEffect, useState } from "react";
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
  FileText,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import StatusNotice from "../components/ui/StatusNotice";
import "../pages/AppShell.css";

const STATUS_MAP = {
  verified: { cls: "badge-verified", text: "Verified", icon: CheckCircle },
  pending: { cls: "badge-pending", text: "Under Review", icon: Clock },
  rejected: { cls: "badge-rejected", text: "Action Needed", icon: AlertCircle },
};

function StatusBadge({ status }) {
  const details = STATUS_MAP[status] || STATUS_MAP.pending;
  const Icon = details.icon;

  return (
    <span className={`badge ${details.cls}`}>
      <Icon size={12} style={{ marginRight: 4 }} /> {details.text}
    </span>
  );
}

const buildVerificationSteps = (user, vehicles) => {
  const steps = [
    {
      key: "email",
      label: "Email",
      icon: Mail,
      status: user?.email ? "verified" : "rejected",
      description: user?.email
        ? `${user.email} is on file for your account.`
        : "Add an email address to keep your account recoverable.",
    },
    {
      key: "phone",
      label: "Phone",
      icon: Phone,
      status: user?.phone ? "verified" : "rejected",
      description: user?.phone
        ? `${user.phone} is available for ride coordination.`
        : "Add a phone number so drivers and passengers can reach you.",
    },
  ];

  if (user?.role === "driver" || user?.drivingLicense?.licenseNumber || vehicles.length > 0) {
    const hasLicense = Boolean(
      user?.drivingLicense?.licenseNumber || user?.drivingLicense?.licenseImage,
    );
    const hasVehicles = vehicles.length > 0;
    const anyVehicleVerified = vehicles.some((vehicle) => vehicle.isVerified);

    steps.push({
      key: "license",
      label: "License",
      icon: FileText,
      status: user?.drivingLicense?.isVerified
        ? "verified"
        : hasLicense
          ? "pending"
          : "rejected",
      description: user?.drivingLicense?.isVerified
        ? "Your driving license has been approved."
        : hasLicense
          ? "Your license has been uploaded and is awaiting admin review."
          : "Upload your driving license to complete driver verification.",
    });

    steps.push({
      key: "vehicle",
      label: "Vehicle",
      icon: Car,
      status: anyVehicleVerified ? "verified" : hasVehicles ? "pending" : "rejected",
      description: anyVehicleVerified
        ? "At least one registered vehicle has been verified."
        : hasVehicles
          ? "Your vehicle documents are under review."
          : "Add a vehicle to start posting rides as a driver.",
    });
  }

  return steps;
};

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRes = await api.get("/api/v1/auth/current-user");
        const currentUser = userRes?.data || {};
        const isDriver = currentUser.role === "driver";

        const [bookingsRes, dashboardRes, vehiclesRes] = await Promise.all([
          api.get("/api/v1/bookings/my-bookings"),
          isDriver ? api.get("/api/v1/rides/driver/dashboard") : Promise.resolve(null),
          isDriver ? api.get("/api/v1/vehicles") : Promise.resolve(null),
        ]);

        const bookings = bookingsRes?.data || [];
        const driverDashboard = dashboardRes?.data || null;
        const driverVehicles = vehiclesRes?.data || [];

        setUser(currentUser);
        setVehicles(driverVehicles);
        setForm({
          firstName: currentUser.firstName || "",
          lastName: currentUser.lastName || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          bio: currentUser.bio || "",
          tagline: currentUser.tagline || "",
        });

        if (isDriver) {
          setStats([
            { label: "Trips", value: `${driverDashboard?.stats?.totalRides || 0}`, icon: Award },
            {
              label: "Rating",
              value:
                typeof currentUser.overallRating === "number"
                  ? currentUser.overallRating.toFixed(1)
                  : "0.0",
              icon: Award,
            },
            {
              label: "Weekly Earned",
              value: `Rs.${Number(driverDashboard?.stats?.weeklyEarnings || 0).toLocaleString("en-IN")}`,
              icon: TrendingUp,
            },
          ]);
        } else {
          const activeBookings = bookings.filter(
            (booking) => booking.bookingStatus !== "cancelled",
          );
          const totalSpent = activeBookings.reduce(
            (sum, booking) =>
              booking.paymentStatus === "paid" ? sum + (booking.totalPrice || 0) : sum,
            0,
          );

          setStats([
            { label: "Trips", value: `${activeBookings.length}`, icon: Award },
            {
              label: "Rating",
              value:
                typeof currentUser.overallRating === "number"
                  ? currentUser.overallRating.toFixed(1)
                  : "0.0",
              icon: Award,
            },
            {
              label: "Spent",
              value: `Rs.${Number(totalSpent).toLocaleString("en-IN")}`,
              icon: TrendingUp,
            },
          ]);
        }
      } catch (err) {
        setNotice({
          tone: "error",
          message: err?.body?.message || err.message || "We could not load your profile right now.",
        });
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          bio: "",
          tagline: "",
        });
      }
    };

    fetchProfile();
  }, [location.key]);

  const set = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.patch("/api/v1/auth/update-profile", form);
      const nextUser = res?.data || user;
      setUser(nextUser);
      setForm({
        firstName: nextUser.firstName || "",
        lastName: nextUser.lastName || "",
        email: nextUser.email || "",
        phone: nextUser.phone || "",
        bio: nextUser.bio || "",
        tagline: nextUser.tagline || "",
      });
      setSaved(true);
      setEditing(false);
      setNotice({
        tone: "success",
        message: "Profile updated successfully.",
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setNotice({
        tone: "error",
        message: err?.body?.message || err.message || "We could not save those profile changes.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return <div className="auth-spinner" style={{ margin: "100px auto" }} />;
  }

  const shellRole =
    user?.role === "driver" && localStorage.getItem("via-role") !== "passenger"
      ? "driver"
      : "passenger";
  const joinedLabel = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "recently";
  const verificationSteps = buildVerificationSteps(user, vehicles);

  return (
    <AppShell title="My Profile" role={shellRole}>
      <StatusNotice
        tone={notice?.tone}
        message={notice?.message}
        onClose={() => setNotice(null)}
        style={{ marginBottom: notice ? 18 : 0 }}
      />

      <div className="page-header">
        <div className="page-header-eyebrow">Account</div>
        <h1 className="page-header-title">
          My <em>Profile</em>
        </h1>
        <p className="page-header-sub">
          Manage your personal information and document verification status.
        </p>
      </div>

      <div className="tab-bar">
        {["info", "verification"].map((item) => (
          <button
            key={item}
            className={`tab-btn ${tab === item ? "active" : ""}`}
            onClick={() => setTab(item)}
          >
            {item === "info" ? "My Info" : "Verification Status"}
          </button>
        ))}
      </div>

      {tab === "info" ? (
        <div className="profile-grid-container layout-split-grid left-1-2" style={{ alignItems: "start" }}>
          <div className="info-card" style={{ textAlign: "center" }}>
            <div
              className="profile-av-container"
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: user?.profilePhoto
                  ? "none"
                  : "linear-gradient(135deg, var(--terracotta), var(--gold))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.2rem",
                fontWeight: 700,
                color: "#fff",
                margin: "0 auto 16px",
                overflow: "hidden",
              }}
            >
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Me"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <MapPin size={14} />{" "}
              {shellRole.charAt(0).toUpperCase() + shellRole.slice(1)} · Joined {joinedLabel}
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
              {stats.map((item) => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "1.3rem",
                      color: "var(--ink)",
                    }}
                  >
                    {item.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--mist)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <item.icon size={12} /> {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="info-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div
                className="info-card-title"
                style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}
              >
                <User size={20} color="var(--terracotta)" />
                Personal Information
              </div>
              {saved ? (
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--forest)",
                    fontWeight: 600,
                  }}
                >
                  Saved
                </span>
              ) : null}
              <button
                onClick={() => (editing ? handleSave() : setEditing(true))}
                className={editing ? "btn-primary" : "btn-outline"}
                style={{ padding: "8px 20px", fontSize: "0.85rem" }}
                disabled={saving}
              >
                {editing ? (saving ? "Saving..." : "Save changes") : "Edit profile"}
              </button>
            </div>

            <div className="layout-card-grid-2">
              {[
                { label: "First name", key: "firstName", icon: User },
                { label: "Last name", key: "lastName", icon: User },
                { label: "Email", key: "email", icon: Mail },
                { label: "Phone", key: "phone", icon: Phone },
              ].map(({ label, key, icon: Icon }) => (
                <div key={key} className="auth-field">
                  <label className="auth-label">{label}</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="auth-input"
                      value={form[key]}
                      onChange={set(key)}
                      disabled={!editing}
                      style={{
                        background: editing ? "var(--parchment)" : "transparent",
                        cursor: editing ? "text" : "default",
                        paddingLeft: 40,
                      }}
                    />
                    <Icon
                      size={16}
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0.4,
                      }}
                    />
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
            <div
              className="info-card-title"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
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
              Verification is reviewed manually and usually takes 24-48 hours. Driver-only
              checks appear here once you upload your documents and vehicle details.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {verificationSteps.map((step) => (
                <div
                  key={step.key}
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
                  <span style={{ fontSize: "1.4rem", color: "var(--ink)", opacity: 0.7 }}>
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
                      {step.description}
                    </div>
                  </div>
                  <StatusBadge status={step.status} />
                  {step.status !== "verified" && (step.key === "license" || step.key === "vehicle") ? (
                    <button
                      className="btn-outline"
                      style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                      onClick={() => navigate("/driver/onboarding")}
                    >
                      Update
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
