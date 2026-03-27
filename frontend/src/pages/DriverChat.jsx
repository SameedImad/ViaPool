import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { SendHorizontal, ArrowLeft, Star, Phone } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Driver.css";

// Dynamic messaging fueled by Socket.IO

export default function DriverChat() {
  const { rideId, passengerId } = useParams();
  const navigate  = useNavigate();
  const [msgs, setMsgs]   = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [me, setMe] = useState(null);
  const [passenger, setPassenger] = useState({ name: "Passenger", letter: "P" });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    const initData = async () => {
       try {
         const userRes = await api.get("/api/v1/auth/current-user");
         setMe(userRes.data);
         
         const passRes = await api.get(`/api/v1/bookings/${rideId}/passengers`);
         const thePass = passRes.data?.find(b => b.passenger._id === passengerId)?.passenger;
         if (thePass) {
           setPassenger({ name: `${thePass.firstName} ${thePass.lastName}`, letter: thePass.firstName[0] });
         }

         const msgRes = await api.get(`/api/v1/messages/${rideId}/${passengerId}`);
         setMsgs((msgRes.data || []).map(m => ({
            id: m._id,
            side: m.sender === userRes.data._id ? "sent" : "recv",
            text: m.message,
            time: new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
         })));
       } catch (err) {
         console.error("Chat init failed", err);
       }
    };
    initData();
  }, [rideId, passengerId]);

  useEffect(() => {
     if (!me) return;
     const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
        withCredentials: true
     });
     
     newSocket.on("connect", () => {
        newSocket.emit("join-user-room", me._id);
     });

     newSocket.on("receive-message", (newMsg) => {
        if (newMsg.ride === rideId && (newMsg.sender === passengerId || newMsg.receiver === passengerId)) {
           setMsgs(prev => [...prev, {
              id: newMsg._id,
              side: newMsg.sender === me._id ? "sent" : "recv",
              text: newMsg.message,
              time: new Date(newMsg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
           }]);
        }
     });

     setSocket(newSocket);
     return () => newSocket.disconnect();
  }, [me, rideId, passengerId]);

  const send = () => {
    if (!input.trim() || !socket || !me) return;
    const text = input.trim();
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    
    setMsgs(ms => [...ms, { id: Date.now(), side: "sent", text, time }]);
    socket.emit("send-message", {
       rideId,
       senderId: me._id,
       receiverId: passengerId,
       message: text
    });
    setInput("");
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <AppShell title="Chat" role="driver" unreadCount={2}>
      {/* Passenger header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, padding: "16px 0", marginBottom: 0,
        borderBottom: "1px solid var(--sand)",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--terracotta), var(--gold))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "#fff", fontSize: "1.1rem",
        }}>{passenger.letter}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>{passenger.name}</div>
          <div style={{ fontSize: "0.76rem", color: "var(--mist)" }}>★ 4.8 · Ride #{rideId} · Passenger</div>
        </div>
        <button
          onClick={() => navigate(`/driver/rides/${rideId}`)}
          className="btn-outline"
          style={{ marginLeft: "auto", fontSize: "0.82rem", padding: "7px 16px", display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={14} /> Back to ride
        </button>
      </div>

      {/* Messages */}
      <div className="chat-wrap" style={{ marginTop: 0 }}>
        <div className="chat-messages">
          {msgs.map(m => (
            <div key={m.id} className={`msg-bubble ${m.side}`}>
              {m.text}
              <div className="msg-time">{m.time}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-bar">
          <textarea
            className="chat-input"
            placeholder="Type a message…"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
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
