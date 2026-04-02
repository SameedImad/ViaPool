import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { ArrowLeft, MapPin, Phone, SendHorizontal } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Driver.css";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export default function PassengerChat() {
  const { rideId, driverId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [socket, setSocket] = useState(null);
  const [me, setMe] = useState(null);
  const [driver, setDriver] = useState({ name: "Driver", letter: "D", phone: "" });
  const [rideDetails, setRideDetails] = useState("");
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [isDriverTyping, setIsDriverTyping] = useState(false);
  const [loadError, setLoadError] = useState("");
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasValidRideId = OBJECT_ID_PATTERN.test(String(rideId || ""));
  const hasValidDriverId = OBJECT_ID_PATTERN.test(String(driverId || ""));

  const appendMessage = (message) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) return prev;
      return [...prev, message];
    });
  };

  const markThreadRead = useEffectEvent(async () => {
    try {
      await api.patch(`/api/v1/messages/${rideId}/${driverId}/read`);
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isDriverTyping]);

  useEffect(() => {
    const initData = async () => {
      if (!hasValidRideId || !hasValidDriverId) {
        setLoadError("This chat is unavailable because the ride or driver information is missing.");
        return;
      }

      try {
        setLoadError("");
        const [userRes, rideRes, msgRes] = await Promise.all([
          api.get("/api/v1/auth/current-user"),
          api.get(`/api/v1/rides/${rideId}`),
          api.get(`/api/v1/messages/${rideId}/${driverId}`),
        ]);

        const currentUser = userRes.data;
        setMe(currentUser);

        const ride = rideRes.data;
        if (ride?.driver) {
          setDriver({
            name: `${ride.driver.firstName} ${ride.driver.lastName}`,
            letter: ride.driver.firstName[0],
            phone: ride.driver.phone || "Unknown",
          });
          const departure = new Date(ride.departureTime);
          setRideDetails(`Ride: ${ride.from?.address?.split(",")[0]} -> ${ride.to?.address?.split(",")[0]} · ${departure.toLocaleDateString()}`);
        }

        setMessages((msgRes.data || []).map((message) => ({
          id: message._id,
          sent: message.sender === currentUser._id,
          text: message.message,
          time: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })));

        await markThreadRead();
      } catch (err) {
        console.error("Passenger chat init failed", err);
        setLoadError(err.status === 404 ? "This ride or driver is no longer available for chat." : err.message || "Failed to load chat.");
      }
    };

    initData();
  }, [driverId, hasValidDriverId, hasValidRideId, rideId]);

  useEffect(() => {
    if (!me || !hasValidRideId || !hasValidDriverId) return;

    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      withCredentials: true,
      auth: {
        token: localStorage.getItem("via-token"),
      },
    });

    newSocket.on("connect", () => {
      newSocket.emit("join-user-room", me._id);
      newSocket.emit("watch-user", driverId);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Passenger chat socket connection failed", err.message);
    });

    newSocket.on("receive-message", (newMsg) => {
      const msgRideId = typeof newMsg.ride === "string" ? newMsg.ride : newMsg.ride?._id;
      const senderId = typeof newMsg.sender === "string" ? newMsg.sender : newMsg.sender?._id;
      const receiverId = typeof newMsg.receiver === "string" ? newMsg.receiver : newMsg.receiver?._id;

      if (msgRideId === rideId && (senderId === driverId || receiverId === driverId)) {
        appendMessage({
          id: newMsg._id,
          sent: senderId === me._id,
          text: newMsg.message,
          time: new Date(newMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });

        if (senderId === driverId) {
          markThreadRead();
        }
      }
    });

    newSocket.on("user-presence", (payload) => {
      if (payload.userId === driverId) {
        setIsDriverOnline(payload.online);
      }
    });

    newSocket.on("typing-status", (payload) => {
      if (payload.rideId === rideId && payload.senderId === driverId) {
        setIsDriverTyping(payload.isTyping);
      }
    });

    setSocket(newSocket);
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      newSocket.disconnect();
    };
  }, [driverId, hasValidDriverId, hasValidRideId, me, rideId]);

  const handleDraftChange = (value) => {
    setDraft(value);
    if (!socket || !me) return;

    socket.emit("typing-start", { rideId, receiverId: driverId, senderId: me._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing-stop", { rideId, receiverId: driverId, senderId: me._id });
    }, 1200);
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !socket || !me || !hasValidDriverId) return;

    socket.emit("typing-stop", { rideId, receiverId: driverId, senderId: me._id });
    socket.emit("send-message", {
      rideId,
      senderId: me._id,
      receiverId: driverId,
      message: text,
    });
    setDraft("");
  };

  const handleKey = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  if (loadError) {
    return (
      <AppShell title="Chat with Driver" role="passenger" unreadCount={2}>
        <div className="info-card" style={{ maxWidth: 640, margin: "40px auto", textAlign: "center" }}>
          <div className="info-card-title">Chat Unavailable</div>
          <p style={{ color: "var(--mist)", lineHeight: 1.7, marginBottom: 18 }}>{loadError}</p>
          <button className="btn-outline" onClick={() => navigate("/passenger/bookings")}>
            <ArrowLeft size={16} /> Back to My Bookings
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Chat with Driver" role="passenger" unreadCount={2}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <button className="btn-outline" style={{ padding: "8px 14px", display: "flex", alignItems: "center" }} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </button>
        <div className="rc-avatar" style={{ width: 44, height: 44, fontSize: "1rem" }}>{driver.letter}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--ink)" }}>{driver.name}</div>
          <div style={{ fontSize: "0.75rem", color: isDriverTyping ? "var(--terracotta)" : "var(--forest)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isDriverTyping ? "var(--terracotta)" : (isDriverOnline ? "var(--forest)" : "var(--mist)"), display: "inline-block" }} />
            {isDriverTyping ? "Typing..." : (isDriverOnline ? "Online" : "Offline")}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button className="btn-outline" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }} onClick={() => navigate(`/rides/${rideId}/track`)}>
            <MapPin size={16} /> Track
          </button>
          <a href={`tel:${driver.phone}`} style={{ textDecoration: "none" }}>
            <button className="btn-fill" style={{ padding: "8px 14px", background: "var(--forest)", display: "flex", alignItems: "center" }}>
              <Phone size={16} />
            </button>
          </a>
        </div>
      </div>

      <div style={{ background: "var(--parchment)", border: "1px solid var(--sand)", borderRadius: 20, overflow: "hidden" }}>
        <div className="chat-wrap">
          <div className="chat-messages">
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <span style={{ fontSize: "0.72rem", background: "var(--sand)", color: "var(--mist)", padding: "4px 12px", borderRadius: 100, fontWeight: 600 }}>
                {rideDetails || "Loading route..."}
              </span>
            </div>
            {messages.map((message) => (
              <div key={message.id} className={`msg-bubble ${message.sent ? "sent" : "recv"}`}>
                {message.text}
                <div className="msg-time">{message.time}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-bar">
            <textarea
              className="chat-input"
              rows={1}
              placeholder="Type a message..."
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              onKeyDown={handleKey}
            />
            <button className="chat-send" onClick={send} disabled={!draft.trim()}>
              <SendHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
