import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { SendHorizontal, ArrowLeft } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Driver.css";

export default function DriverChat() {
  const { rideId, passengerId } = useParams();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [me, setMe] = useState(null);
  const [passenger, setPassenger] = useState({ name: "Passenger", letter: "P" });
  const [isPassengerOnline, setIsPassengerOnline] = useState(false);
  const [isPassengerTyping, setIsPassengerTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const appendMessage = (message) => {
    setMsgs((prev) => {
      if (prev.some((item) => item.id === message.id)) return prev;
      return [...prev, message];
    });
  };

  const markThreadRead = async () => {
    try {
      await api.patch(`/api/v1/messages/${rideId}/${passengerId}/read`);
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, isPassengerTyping]);

  useEffect(() => {
    const initData = async () => {
      try {
        const userRes = await api.get("/api/v1/auth/current-user");
        setMe(userRes.data);

        const passRes = await api.get(`/api/v1/bookings/${rideId}/passengers`);
        const thePassenger = passRes.data?.find((booking) => booking.passenger._id === passengerId)?.passenger;
        if (thePassenger) {
          setPassenger({
            name: `${thePassenger.firstName} ${thePassenger.lastName}`,
            letter: thePassenger.firstName[0],
          });
        }

        const msgRes = await api.get(`/api/v1/messages/${rideId}/${passengerId}`);
        setMsgs((msgRes.data || []).map((message) => ({
          id: message._id,
          side: message.sender === userRes.data._id ? "sent" : "recv",
          text: message.message,
          time: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })));

        await markThreadRead();
      } catch (err) {
        console.error("Driver chat init failed", err);
      }
    };

    initData();
  }, [rideId, passengerId]);

  useEffect(() => {
    if (!me) return;

    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      withCredentials: true,
      auth: {
        token: localStorage.getItem("via-token"),
      },
    });

    newSocket.on("connect", () => {
      newSocket.emit("join-user-room", me._id);
      newSocket.emit("watch-user", passengerId);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Driver chat socket connection failed", err.message);
    });

    newSocket.on("receive-message", (newMsg) => {
      const msgRideId = typeof newMsg.ride === "string" ? newMsg.ride : newMsg.ride?._id;
      const senderId = typeof newMsg.sender === "string" ? newMsg.sender : newMsg.sender?._id;
      const receiverId = typeof newMsg.receiver === "string" ? newMsg.receiver : newMsg.receiver?._id;

      if (msgRideId === rideId && (senderId === passengerId || receiverId === passengerId)) {
        appendMessage({
          id: newMsg._id,
          side: senderId === me._id ? "sent" : "recv",
          text: newMsg.message,
          time: new Date(newMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });

        if (senderId === passengerId) {
          markThreadRead();
        }
      }
    });

    newSocket.on("user-presence", (payload) => {
      if (payload.userId === passengerId) {
        setIsPassengerOnline(payload.online);
      }
    });

    newSocket.on("typing-status", (payload) => {
      if (payload.rideId === rideId && payload.senderId === passengerId) {
        setIsPassengerTyping(payload.isTyping);
      }
    });

    setSocket(newSocket);
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      newSocket.disconnect();
    };
  }, [me, rideId, passengerId]);

  const handleInputChange = (value) => {
    setInput(value);
    if (!socket || !me) return;

    socket.emit("typing-start", { rideId, receiverId: passengerId, senderId: me._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing-stop", { rideId, receiverId: passengerId, senderId: me._id });
    }, 1200);
  };

  const send = () => {
    if (!input.trim() || !socket || !me) return;
    const text = input.trim();

    socket.emit("typing-stop", { rideId, receiverId: passengerId, senderId: me._id });
    socket.emit("send-message", {
      rideId,
      senderId: me._id,
      receiverId: passengerId,
      message: text,
    });
    setInput("");
  };

  const handleKey = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <AppShell title="Chat" role="driver" unreadCount={2}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", marginBottom: 0, borderBottom: "1px solid var(--sand)" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--terracotta), var(--gold))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "#fff", fontSize: "1.1rem",
        }}>{passenger.letter}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>{passenger.name}</div>
          <div style={{ fontSize: "0.76rem", color: isPassengerTyping ? "var(--terracotta)" : "var(--mist)" }}>
            {isPassengerTyping ? "Typing..." : `${isPassengerOnline ? "Online" : "Offline"} · Passenger`}
          </div>
        </div>
        <button
          onClick={() => navigate(`/driver/rides/${rideId}`)}
          className="btn-outline"
          style={{ marginLeft: "auto", fontSize: "0.82rem", padding: "7px 16px", display: "flex", alignItems: "center", gap: 6 }}
        >
          <ArrowLeft size={14} /> Back to ride
        </button>
      </div>

      <div className="chat-wrap" style={{ marginTop: 0 }}>
        <div className="chat-messages">
          {msgs.map((message) => (
            <div key={message.id} className={`msg-bubble ${message.side}`}>
              {message.text}
              <div className="msg-time">{message.time}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-bar">
          <textarea
            className="chat-input"
            placeholder="Type a message..."
            rows={1}
            value={input}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleKey}
          />
          <button className="chat-send" onClick={send} disabled={!input.trim()} aria-label="Send">
            <SendHorizontal size={18} />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
