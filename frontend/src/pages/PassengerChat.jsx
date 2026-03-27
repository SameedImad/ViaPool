import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import "../pages/AppShell.css";
import "../pages/Driver.css";  // reuse chat styles

// Using WebSocket for real-time messages

export default function PassengerChat() {
  const { rideId, driverId } = useParams();
  const navigate              = useNavigate();
  const [messages, setMessages] = useState([]);
  const [draft,    setDraft]    = useState("");
  const bottomRef = useRef(null);
  const [socket, setSocket]     = useState(null);
  const [me, setMe]             = useState(null);
  const [driver, setDriver]     = useState({ name: "Driver", letter: "D", phone: "" });
  const [rideDetails, setRideDetails] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const initData = async () => {
       try {
         const [userRes, rideRes, msgRes] = await Promise.all([
           api.get("/api/v1/auth/current-user"),
           api.get(`/api/v1/rides/${rideId}`),
           api.get(`/api/v1/messages/${rideId}/${driverId}`)
         ]);
         
         const currentUser = userRes.data.data;
         setMe(currentUser);
         
         const r = rideRes.data.data;
         if (r && r.driver) {
           setDriver({ 
             name: `${r.driver.firstName} ${r.driver.lastName}`, 
             letter: r.driver.firstName[0],
             phone: r.driver.phone || "Unknown" 
           });
           const d = new Date(r.departureTime);
           setRideDetails(`Ride: ${r.from?.address?.split(',')[0]} → ${r.to?.address?.split(',')[0]} · ${d.toLocaleDateString()}`);
         }

         setMessages((msgRes.data.data || []).map(m => ({
            id: m._id,
            sent: m.sender === currentUser._id,
            text: m.message,
            time: new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
         })));
       } catch (err) {
         console.error("Passenger Chat init failed", err);
       }
    };
    initData();
  }, [rideId, driverId]);

  useEffect(() => {
     if (!me) return;
     const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
        withCredentials: true
     });
     
     newSocket.on("connect", () => {
        newSocket.emit("join-user-room", me._id);
     });

     newSocket.on("receive-message", (newMsg) => {
        if (newMsg.ride === rideId && (newMsg.sender === driverId || newMsg.receiver === driverId)) {
           setMessages(prev => [...prev, {
              id: newMsg._id,
              sent: newMsg.sender === me._id,
              text: newMsg.message,
              time: new Date(newMsg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
           }]);
        }
     });

     setSocket(newSocket);
     return () => newSocket.disconnect();
  }, [me, rideId, driverId]);

  const send = () => {
    const text = draft.trim();
    if (!text || !socket || !me) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    
    setMessages(m => [...m, { id: Date.now(), text, sent: true, time }]);
    socket.emit("send-message", {
       rideId,
       senderId: me._id,
       receiverId: driverId,
       message: text
    });
    setDraft("");
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <AppShell title="Chat with Driver" role="passenger" unreadCount={2}>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <button className="btn-outline" style={{ padding: "8px 14px" }} onClick={() => navigate(-1)}>←</button>
        <div className="rc-avatar" style={{ width: 44, height: 44, fontSize: "1rem" }}>{driver.letter}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--ink)" }}>{driver.name}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--forest)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--forest)", display: "inline-block", animation: "liveBlink 1.4s infinite" }} />
            Online
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button className="btn-outline" style={{ padding: "8px 14px" }} onClick={() => navigate(`/rides/${rideId}/track`)}>📍 Track</button>
          <a href="tel:+919876543210" style={{ textDecoration: "none" }}>
            <button className="btn-fill" style={{ padding: "8px 14px", background: "var(--forest)" }}>📞</button>
          </a>
        </div>
      </div>

      {/* Chat */}
      <div style={{ background: "var(--parchment)", border: "1px solid var(--sand)", borderRadius: 20, overflow: "hidden" }}>
        <div className="chat-wrap">
          <div className="chat-messages">
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <span style={{ fontSize: "0.72rem", background: "var(--sand)", color: "var(--mist)", padding: "4px 12px", borderRadius: 100, fontWeight: 600 }}>
                {rideDetails || "Loading route..."}
              </span>
            </div>
            {messages.map(m => (
              <div key={m.id} className={`msg-bubble ${m.sent ? "sent" : "recv"}`}>
                {m.text}
                <div className="msg-time">{m.time}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-bar">
            <textarea
              className="chat-input"
              rows={1}
              placeholder="Type a message…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
            />
            <button className="chat-send" onClick={send} disabled={!draft.trim()}>➤</button>
          </div>
        </div>
      </div>

      <style>{`@keyframes liveBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
    </AppShell>
  );
}
