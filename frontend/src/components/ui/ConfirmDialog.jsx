export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--cream)",
          borderRadius: 20,
          padding: 28,
          maxWidth: 420,
          width: "100%",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.25rem",
            color: "var(--ink)",
            marginBottom: 10,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--mist)",
            lineHeight: 1.6,
            marginBottom: 22,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-outline" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={danger ? "btn-reject" : "btn-primary"}
            style={{ flex: 1 }}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
