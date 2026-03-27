import api from "../lib/api";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
// For now, keeping a mock chart until we have enough historical data
const MONTHLY = [3200, 4800, 5100, 6400, 4200, 7800];

const STATUS_MAP = {
  paid:    { cls: "badge-verified", label: "Paid" },
  pending: { cls: "badge-pending",  label: "Pending" },
};

export default function Earnings() {
  const [filter, setFilter] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get("/api/v1/earnings/driver-history");
        setTransactions(res.data.data);
      } catch (err) {
        console.error("Failed to fetch earnings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  const maxVal = Math.max(...MONTHLY);

  const filtered = filter === "All" ? transactions
    : transactions.filter(t => t.status === filter.toLowerCase());

  const total = transactions.filter(t => t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const pending = transactions.filter(t => t.status === "pending").reduce((s, t) => s + t.amount, 0);

  return (
    <AppShell title="Earnings" role="driver" unreadCount={3}>
      <div className="page-header">
        <div className="page-header-eyebrow">Driver</div>
        <h1 className="page-header-title">Your <em>Earnings</em></h1>
        <p className="page-header-sub">Track your revenue, payment status, and monthly trends.</p>
      </div>

      {/* ── Stats ── */}
      <div className="stat-grid">
        {[
          { label: "Total earned",     value: `₹${total.toLocaleString()}`,   sub: "all time" },
          { label: "Pending payout",   value: `₹${pending.toLocaleString()}`, sub: "being processed" },
          { label: "Total rides",      value: transactions.length,            sub: "recorded" },
          { label: "Avg per ride",     value: total === 0 ? "₹0" : `₹${Math.round(total / (transactions.filter(t => t.status === "paid").length || 1))}`, sub: "per completed trip" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
        {/* ── Transaction table ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--ink)" }}>Payment History</div>
            <div className="tab-bar" style={{ margin: 0 }}>
              {["All", "Paid", "Pending"].map(f => (
                <button key={f} className={`tab-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="info-card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--parchment)" }}>
                  {["Date", "Route", "Pax", "Amount", "Status"].map(h => (
                    <th key={h} style={{ padding: "13px 20px", textAlign: "left", fontSize: "0.75rem", color: "var(--mist)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid var(--sand)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 === 0 ? "var(--cream)" : "var(--parchment)" }}>
                    <td style={{ padding: "14px 20px", fontSize: "0.82rem", color: "var(--mist)", whiteSpace: "nowrap" }}>{t.date}</td>
                    <td style={{ padding: "14px 20px", fontSize: "0.85rem", color: "var(--ink)", fontWeight: 500 }}>{t.from}</td>
                    <td style={{ padding: "14px 20px", fontSize: "0.85rem", color: "var(--mist)", textAlign: "center" }}>{t.passengers}</td>
                    <td style={{ padding: "14px 20px", fontFamily: "var(--font-serif)", fontSize: "1rem", color: "var(--ink)" }}>₹{t.amount}</td>
                    <td style={{ padding: "14px 20px" }}><span className={`badge ${STATUS_MAP[t.status].cls}`}>{STATUS_MAP[t.status].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Monthly chart ── */}
        <div className="info-card">
          <div className="info-card-title">Monthly Overview</div>
          <div className="earnings-bar-chart" style={{ marginBottom: 16 }}>
            {MONTHLY.map((val, i) => (
              <div className="ebc-col" key={MONTHS[i]}>
                <div className="ebc-amt">₹{(val / 1000).toFixed(1)}k</div>
                <div className="ebc-bar-wrap">
                  <div className="ebc-bar" style={{ height: `${Math.round((val / maxVal) * 100)}%`, opacity: i === MONTHLY.length - 1 ? 1 : 0.55 }} />
                </div>
                <div className="ebc-day">{MONTHS[i]}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--mist)", lineHeight: 1.7 }}>
            📈 Your best month so far is <strong>March</strong> at ₹7,800. You're trending 34% above your average.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
