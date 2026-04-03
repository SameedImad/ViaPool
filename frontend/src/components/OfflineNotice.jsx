import { useEffect, useState } from "react";

export default function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [isReady, setIsReady] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleReady = () => setIsReady(true);
    const handleUpdate = () => setHasUpdate(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("viapool:pwa-ready", handleReady);
    window.addEventListener("viapool:pwa-update", handleUpdate);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("viapool:pwa-ready", handleReady);
      window.removeEventListener("viapool:pwa-update", handleUpdate);
    };
  }, []);

  if (!isOffline && !isReady && !hasUpdate) return null;

  const message = isOffline
    ? "You're offline. Saved screens still work, but live tracking, chat, and payments need a connection."
    : hasUpdate
      ? "A newer ViaPool app version is available. Refresh when you're ready."
      : "ViaPool is ready to install and use with basic offline support.";

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 2000,
        background: isOffline ? "#c4622d" : "#1f5f4a",
        color: "#fff",
        padding: "10px 16px",
        fontSize: "0.9rem",
        lineHeight: 1.5,
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}
