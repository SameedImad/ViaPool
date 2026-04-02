import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Car, CircleOff, CreditCard, Map, MessageCircle, TriangleAlert } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";

const CATEGORIES = ["All", "Rides", "Payments", "Chat", "System"];

const TYPE_TO_CAT = {
  booking_request: "Rides",
  booking_confirmed: "Rides",
  booking_cancelled: "Rides",
  payment_success: "Payments",
  payment_failed: "Payments",
  ride_cancelled: "Rides",
  new_message: "Chat",
};

const TYPE_TO_ICON = {
  booking_request: Car,
  booking_confirmed: Map,
  booking_cancelled: CircleOff,
  payment_success: CreditCard,
  payment_failed: TriangleAlert,
  ride_cancelled: CircleOff,
  new_message: MessageCircle,
};

const PREF_ITEMS = [
  { key: "rides", label: "Ride updates", sub: "Bookings, cancellations, status changes" },
  { key: "payments", label: "Payment alerts", sub: "Confirmations, receipts, payouts" },
  { key: "chat", label: "Chat messages", sub: "New messages from drivers/passengers" },
  { key: "system", label: "System notices", sub: "Account, verification, promotions" },
];

export default function Notifications() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cat, setCat] = useState("All");
  const [notifs, setNotifs] = useState([]);
  const [prefs, setPrefs] = useState({ rides: true, payments: true, chat: true, system: false });
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await api.get("/api/v1/notifications");
      const formatted = res.data.map((n) => ({
        id: n._id,
        cat: TYPE_TO_CAT[n.type] || "System",
        Icon: TYPE_TO_ICON[n.type] || Bell,
        title: n.type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        body: n.message,
        time: new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        unread: !n.isRead,
        actionPath: n.actionPath || null,
      }));
      setNotifs(formatted);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [location.key]);

  const filtered = cat === "All" ? notifs : notifs.filter((n) => n.cat === cat);
  const unread = notifs.filter((n) => n.unread).length;

  const markAllRead = async () => {
    try {
      await api.patch("/api/v1/notifications/mark-all-read");
      setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })));
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const markRead = async (id) => {
    const n = notifs.find((x) => x.id === id);
    if (!n || !n.unread) return;

    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      setNotifs((ns) => ns.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const handleNotificationClick = async (notification) => {
    await markRead(notification.id);

    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
  };

  return (
    <AppShell title="Notifications" unreadCount={unread}>
      <div className="page-header">
        <div className="page-header-eyebrow">Inbox</div>
        <h1 className="page-header-title">Your <em>Notifications</em></h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div className="tab-bar" style={{ margin: 0 }}>
              {CATEGORIES.map((c) => (
                <button key={c} className={`tab-btn ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>
            {unread > 0 && (
              <button className="btn-outline" onClick={markAllRead} style={{ fontSize: "0.82rem", padding: "7px 16px" }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--mist)", fontSize: "0.95rem" }}>
                {loading ? "Loading notifications..." : "No notifications in this category."}
              </div>
            )}
            {filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "16px 20px",
                  borderRadius: 14,
                  background: n.unread ? "rgba(196,98,45,0.04)" : "var(--parchment)",
                  border: `1.5px solid ${n.unread ? "rgba(196,98,45,0.2)" : "var(--sand)"}`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    flexShrink: 0,
                    background: n.unread ? "rgba(196,98,45,0.1)" : "var(--cream)",
                    border: "1px solid var(--sand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <n.Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: n.unread ? 700 : 600, fontSize: "0.9rem", color: "var(--ink)" }}>
                      {n.unread && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "var(--terracotta)",
                            marginRight: 7,
                            verticalAlign: "middle",
                          }}
                        />
                      )}
                      {n.title}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--mist)", flexShrink: 0 }}>{n.time}</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--mist)", lineHeight: 1.5 }}>{n.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="info-card" style={{ position: "sticky", top: 80 }}>
          <div className="info-card-title">Notification Preferences</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {PREF_ITEMS.map((item) => (
              <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--mist)", lineHeight: 1.4 }}>{item.sub}</div>
                </div>
                <label style={{ position: "relative", width: 40, height: 22, flexShrink: 0, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={prefs[item.key]}
                    onChange={(e) => setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))}
                    style={{ display: "none" }}
                  />
                  <div style={{ width: 40, height: 22, borderRadius: 11, background: prefs[item.key] ? "var(--forest)" : "var(--sand)", transition: "background 0.25s", position: "relative" }}>
                    <div style={{ position: "absolute", top: 3, left: prefs[item.key] ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
