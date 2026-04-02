const ACCENTS = {
  success: {
    border: "rgba(45,74,53,0.22)",
    background: "rgba(45,74,53,0.08)",
    color: "var(--forest)",
  },
  error: {
    border: "rgba(196,98,45,0.24)",
    background: "rgba(196,98,45,0.08)",
    color: "var(--terracotta)",
  },
  info: {
    border: "rgba(112,104,90,0.2)",
    background: "rgba(112,104,90,0.08)",
    color: "var(--ink)",
  },
};

export default function StatusNotice({ tone = "info", message, onClose, style }) {
  if (!message) return null;

  const accent = ACCENTS[tone] || ACCENTS.info;

  return (
    <div
      style={{
        border: `1px solid ${accent.border}`,
        background: accent.background,
        color: accent.color,
        borderRadius: 14,
        padding: "12px 14px",
        fontSize: "0.84rem",
        lineHeight: 1.6,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        ...style,
      }}
    >
      <span>{message}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notice"
          style={{
            border: "none",
            background: "transparent",
            color: "inherit",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: "pointer",
            lineHeight: 1,
            padding: 0,
          }}
        >
          x
        </button>
      ) : null}
    </div>
  );
}
