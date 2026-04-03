import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Clock, MessageCircle, Phone, Check, AlertTriangle, ArrowLeft, CarFront, Flag, UserRound } from "lucide-react";
import api, { API_URL } from "../lib/api";
import { logger } from "../lib/logger";
import AppShell from "../components/AppShell";
import LeafletMap from "../components/LeafletMap";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatusNotice from "../components/ui/StatusNotice";
import "../pages/AppShell.css";
import "../pages/Passenger.css";

const STOPS  = [
  { id: "scheduled", label: "Scheduled", done: true },
  { id: "ongoing", label: "En Route", done: false },
  { id: "completed", label: "Destination", done: false },
];

const DEFAULT_COORDS = { lat: 20.5937, lng: 78.9629 };
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const toLatLng = (pointLike) => {
  if (!pointLike) return null;

  const coords =
    (Array.isArray(pointLike?.location?.coordinates) && pointLike.location.coordinates) ||
    (Array.isArray(pointLike?.coordinates) && pointLike.coordinates) ||
    null;

  if (!coords || coords.length !== 2) return null;
  const [lng, lat] = coords;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  return { lat, lng };
};

const geocodeAddressToLatLng = async (address) => {
  const normalized = String(address || "").trim();
  if (!normalized) return null;

  try {
    const query = /india/i.test(normalized) ? normalized : `${normalized}, India`;
    const res = await api.get(`/api/v1/maps/autocomplete?input=${encodeURIComponent(query)}`);
    const best = res?.data?.[0]?.location;
    if (!best) return null;
    return { lat: best.lat, lng: best.lng };
  } catch (err) {
    logger.error("Failed to geocode fallback address", err);
    return null;
  }
};

export default function LiveTracking() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [etaMins, setEtaMins] = useState(12);
  const [ride, setRide] = useState(null);
  const [socket, setSocket] = useState(null);
  const [driverCoords, setDriverCoords] = useState(null);
  const [passengerCoords, setPassengerCoords] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [status, setStatus] = useState("scheduled");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);
  const [showSosDialog, setShowSosDialog] = useState(false);
  const [sendingSos, setSendingSos] = useState(false);
  const effectivePassengerCoords = passengerCoords || pickupCoords;
  const hasValidRideId = OBJECT_ID_PATTERN.test(String(rideId || ""));
  const mapCenter =
    effectivePassengerCoords ||
    pickupCoords ||
    destinationCoords ||
    driverCoords ||
    DEFAULT_COORDS;

  useEffect(() => {
    const fetchRide = async () => {
      if (!hasValidRideId) {
        setLoadError("This live tracking link is invalid.");
        setLoading(false);
        return;
      }

      try {
        setLoadError("");
        const [rideRes, bookingsRes] = await Promise.all([
          api.get(`/api/v1/rides/${rideId}`),
          api.get("/api/v1/bookings/my-bookings"),
        ]);
        const r = rideRes.data;
        const booking = (bookingsRes.data || []).find((item) => {
          const bookingRideId = item?.ride?._id || item?.ride;
          return String(bookingRideId) === String(rideId);
        });
        setRide(r);
        setStatus(r.status);

        let rideFromPoint = toLatLng(r.from);
        if (!rideFromPoint && r?.from?.address) {
          rideFromPoint = await geocodeAddressToLatLng(r.from.address);
        }
        if (rideFromPoint) {
          setDriverCoords(rideFromPoint);
          setPickupCoords(rideFromPoint);
        }

        let rideToPoint = toLatLng(r.to);
        if (!rideToPoint && r?.to?.address) {
          rideToPoint = await geocodeAddressToLatLng(r.to.address);
        }
        if (rideToPoint) {
          setDestinationCoords(rideToPoint);
        }

        let bookingPickup = toLatLng(booking?.pickupPoint);
        if (!bookingPickup && booking?.pickupPoint?.address) {
          bookingPickup = await geocodeAddressToLatLng(booking.pickupPoint.address);
        }
        if (bookingPickup) {
          setPickupCoords(bookingPickup);
        }

        let bookingDrop = toLatLng(booking?.dropPoint);
        if (!bookingDrop && booking?.dropPoint?.address) {
          bookingDrop = await geocodeAddressToLatLng(booking.dropPoint.address);
        }
        if (bookingDrop) {
          setDestinationCoords(bookingDrop);
        }
      } catch (err) {
        logger.error("Failed to fetch ride", err);
        setLoadError(err.status === 404 ? "This ride is no longer available for live tracking." : err.message || "Failed to load live tracking.");
      } finally {
        setLoading(false);
      }
    };

    fetchRide();

    if (!hasValidRideId) return;

    const socket = io(API_URL, {
      withCredentials: true,
      auth: {
        token: localStorage.getItem("via-token"),
      }
    });

    socket.on("connect", () => {
      socket.emit("join-ride-room", rideId);
    });

    socket.on("connect_error", (err) => {
      logger.error("Live tracking socket connection failed", err);
    });

    socket.on("driver-location", (data) => {
      setDriverCoords({ lat: data.lat, lng: data.lng });
    });

    socket.on("ride-status-update", (data) => {
      if (data.rideId === rideId) {
        setStatus(data.status);
      }
    });

    setSocket(socket);

    return () => socket.disconnect();
  }, [hasValidRideId, rideId]);

  useEffect(() => {
    if (!navigator.geolocation || !hasValidRideId) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setPassengerCoords(nextCoords);
        if (socket) {
          socket.emit("passenger-location-update", { rideId, ...nextCoords });
        }
      },
      (error) => {
        logger.error("Failed to get passenger location", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [hasValidRideId, socket, rideId]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!driverCoords || !destinationCoords) return;

      try {
        const buildRoute = async (originPoint, destinationPoint) => {
          const origin = `${originPoint.lng},${originPoint.lat}`;
          const destination = `${destinationPoint.lng},${destinationPoint.lat}`;
          const res = await api.get(`/api/v1/maps/route?origin=${origin}&destination=${destination}`);
          return res.data || {};
        };

        const shouldRouteViaPassenger =
          effectivePassengerCoords &&
          (Math.abs(effectivePassengerCoords.lat - driverCoords.lat) > 0.0005 ||
            Math.abs(effectivePassengerCoords.lng - driverCoords.lng) > 0.0005) &&
          (Math.abs(effectivePassengerCoords.lat - destinationCoords.lat) > 0.0005 ||
            Math.abs(effectivePassengerCoords.lng - destinationCoords.lng) > 0.0005);

        if (shouldRouteViaPassenger) {
          const firstLeg = await buildRoute(driverCoords, effectivePassengerCoords);
          const secondLeg = await buildRoute(effectivePassengerCoords, destinationCoords);
          const stitchedPath = [
            ...(firstLeg.path || []),
            ...((secondLeg.path || []).slice(1)),
          ];
          setRoutePath(stitchedPath);

          const combinedDuration = (firstLeg.duration || 0) + (secondLeg.duration || 0);
          if (combinedDuration > 0) {
            setEtaMins(Math.max(1, Math.round(combinedDuration / 60)));
          }
          return;
        }

        const directRoute = await buildRoute(driverCoords, destinationCoords);
        setRoutePath(directRoute.path || []);

        if (typeof directRoute.duration === "number") {
          setEtaMins(Math.max(1, Math.round(directRoute.duration / 60)));
        }
      } catch (err) {
        logger.error("Failed to fetch live route", err);
        setRoutePath([driverCoords, effectivePassengerCoords, destinationCoords].filter(Boolean));
      }
    };

    fetchRoute();
  }, [driverCoords, effectivePassengerCoords, destinationCoords]);

  const handleSOS = async () => {
    try {
      setSendingSos(true);
      setNotice(null);
      await api.post("/api/v1/sos/trigger", {
        rideId,
        lat: effectivePassengerCoords?.lat || driverCoords?.lat || DEFAULT_COORDS.lat,
        lng: effectivePassengerCoords?.lng || driverCoords?.lng || DEFAULT_COORDS.lng,
        message: "Passenger triggered emergency SOS"
      });
      setNotice({
        tone: "success",
        message: "SOS alert sent. Emergency contacts and admins have been notified.",
      });
      setShowSosDialog(false);
    } catch (err) {
      setNotice({
        tone: "error",
        message: err?.body?.message || err.message || "Failed to send SOS alert.",
      });
    } finally {
      setSendingSos(false);
    }
  };

  useEffect(() => {
    if (status !== "ongoing") return;
    const t = setInterval(() => setEtaMins((mins) => Math.max(0, mins - 1)), 60000);
    return () => clearInterval(t);
  }, [status]);

  if (loading) {
    return <AppShell title="Loading..." role="passenger"><div className="auth-spinner" style={{ margin: "40px auto" }}></div></AppShell>;
  }

  if (loadError) {
    return (
      <AppShell title="Live Tracking" role="passenger" unreadCount={2}>
        <div className="info-card" style={{ maxWidth: 640, margin: "40px auto", textAlign: "center" }}>
          <div className="info-card-title">Live Tracking Unavailable</div>
          <p style={{ color: "var(--mist)", lineHeight: 1.7, marginBottom: 18 }}>{loadError}</p>
          <button className="btn-outline" onClick={() => navigate("/passenger/bookings")}>
            <ArrowLeft size={16} /> Back to My Bookings
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Live Tracking" role="passenger" unreadCount={2}>
      <StatusNotice
        tone={notice?.tone}
        message={notice?.message}
        onClose={() => setNotice(null)}
        style={{ marginBottom: notice ? 18 : 0 }}
      />

      <div className="page-header">
        <div className="page-header-eyebrow">Live · Updating real-time</div>
        <h1 className="page-header-title">Track <em>Your Ride</em></h1>
      </div>

      <div className="track-map" style={{ height: 400, borderRadius: 24, overflow: "hidden", position: "relative", zIndex: 1 }}>
        <LeafletMap
          center={mapCenter}
          driverCoords={driverCoords}
          passengerCoords={effectivePassengerCoords}
          destinationCoords={destinationCoords}
          routePath={routePath}
          showMarkerLabels
          zoom={15}
        />
        <div className="track-eta-banner" style={{ zIndex: 1000 }}>
          <Clock size={14} /> {status === "completed" ? "Arrived" : `ETA ${etaMins} mins`} · {status === "ongoing" ? "Active" : "Scheduled"}
        </div>
      </div>

      <div className="layout-sidebar-grid sidebar-300" style={{ gap: 20 }}>
        <div>
          <div className="driver-location-card">
            <div className="dlc-av">{ride?.driver?.firstName?.[0] || "?"}</div>
            <div className="dlc-info">
              <div className="dlc-name">{ride?.driver?.firstName} {ride?.driver?.lastName}</div>
              <div className="dlc-status">
                <span className="live-dot" style={{ background: status === "ongoing" ? "var(--forest)" : "var(--mist)" }} />
                {status === "ongoing" ? "Moving" : status.charAt(0).toUpperCase() + status.slice(1)} · {ride?.vehicle?.brand} {ride?.vehicle?.model}
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--mist)", marginTop: 6, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <CarFront size={14} color="#2d6ea3" />
                  Driver
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <UserRound size={14} color="#c4622d" />
                  {passengerCoords ? "You" : "Pickup"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Flag size={14} color="#2d4a35" />
                  Destination
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-outline" style={{ padding: "8px 14px", display: "flex", alignItems: "center" }} onClick={() => navigate(`/rides/${rideId}/chat/driver/${ride?.driver?._id}`)}>
                <MessageCircle size={18} />
              </button>
              <a href={`tel:${ride?.driver?.phone || "+919876543210"}`} style={{ textDecoration: "none" }}>
                <button className="btn-fill" style={{ padding: "8px 14px", background: "var(--forest)", display: "flex", alignItems: "center" }}><Phone size={18} /></button>
              </a>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-title">Journey Progress</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {STOPS.map((s, i) => {
                const isDone = s.id === "scheduled" || (s.id === "ongoing" && (status === "ongoing" || status === "completed")) || (s.id === "completed" && status === "completed");
                const isActive = s.id === status;

                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "flex-start", gap: 16, paddingBottom: i < STOPS.length - 1 ? 20 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: isDone ? "var(--forest)" : isActive ? "rgba(196,98,45,0.15)" : "var(--sand)",
                        border: isActive ? "2px solid var(--terracotta)" : "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.8rem", color: isDone ? "#fff" : "var(--mist)",
                        flexShrink: 0,
                      }}>
                        {isDone ? <Check size={14} /> : i + 1}
                      </div>
                      {i < STOPS.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 20, background: isDone ? "var(--forest)" : "var(--sand)", marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--ink)", marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: "0.75rem", color: isDone ? "var(--forest)" : "var(--mist)" }}>
                        {isDone ? "Completed" : isActive ? "In progress..." : "Upcoming"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="info-card" style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: "0.78rem", color: "var(--mist)", fontWeight: 600, marginBottom: 8 }}>Estimated Arrival</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {etaMins}
            </div>
            <div style={{ color: "var(--mist)", fontSize: "0.88rem", marginTop: 4 }}>minutes</div>
          </div>

          <div className="info-card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "0.8rem", color: "var(--mist)", marginBottom: 10 }}>Map Legend</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.86rem", color: "var(--ink)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CarFront size={16} color="#2d6ea3" />
                Driver current location
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserRound size={16} color="#c4622d" />
                {passengerCoords ? "Your live location" : "Pickup point"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Flag size={16} color="#2d4a35" />
                Destination
              </div>
            </div>
          </div>

          <div className="info-card" style={{ borderColor: "rgba(196,98,45,0.25)", background: "rgba(196,98,45,0.04)" }}>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--terracotta)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={16} /> Emergency
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--mist)", marginBottom: 12, lineHeight: 1.6 }}>
              Feeling unsafe? Tap SOS to alert emergency contacts.
            </p>
            <button
              style={{
                width: "100%", padding: "12px", borderRadius: 12, border: "none",
                background: "var(--terracotta)", color: "#fff",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.9rem",
                cursor: "pointer", letterSpacing: "0.02em",
              }}
              onClick={() => setShowSosDialog(true)}
            >
              Send SOS Alert
            </button>
          </div>

          <button className="btn-outline" style={{ width: "100%", marginTop: 14 }} onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back to Booking
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showSosDialog}
        title="Send emergency SOS?"
        message="This will notify admins with your current ride and location details. Use it only if you feel unsafe or need urgent help."
        confirmLabel="Send SOS"
        danger
        busy={sendingSos}
        onCancel={() => setShowSosDialog(false)}
        onConfirm={handleSOS}
      />
    </AppShell>
  );
}
