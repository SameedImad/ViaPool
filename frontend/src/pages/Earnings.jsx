import { useState, useEffect } from "react";
import AppShell from "../components/AppShell";
import api from "../lib/api";
import { logger } from "../lib/logger";

const STATUS_MAP = {
  paid: { cls: "badge-verified", label: "Paid" },
  pending: { cls: "badge-pending", label: "Pending" },
};

export default function Earnings() {
  const [filter, setFilter] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ total: 0, pending: 0 });
  const [earningsChart, setEarningsChart] = useState([]);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get("/api/v1/earnings/driver-history");
        const { transactions, total, pending, chartData } = res.data;
        setTransactions(transactions || []);
        setTotals({ total: total || 0, pending: pending || 0 });
        setEarningsChart(chartData || []);
      } catch (err) {
        logger.error("Failed to fetch earnings", err);
      }
    };
    fetchEarnings();
  }, []);

  const chartMax = Math.max(...earningsChart.map(d => d.amt), 100);

  const filtered = filter === "All" ? transactions
    : transactions.filter(t => t.status === filter.toLowerCase());

  const total = totals.total;
  const pending = totals.pending;

  return (
    <AppShell title="Earnings" role="driver">
      <div className="page-header">
        <div className="page-header-eyebrow">Driver</div>
        <h1 className="page-header-title">Your <em>Earnings</em></h1>
        <p className="page-header-sub">Track your revenue, payment status, and monthly trends.</p>
      </div>

      {/* ── Stats ── */}
      <div className="stat-grid">
        {[
          { label: "Total earned", value: `₹${total.toLocaleString()}`, sub: "all time" },
          { label: "Pending payout", value: `₹${pending.toLocaleString()}`, sub: "being processed" },
          { label: "Total rides", value: transactions.length, sub: "recorded" },
          { label: "Avg per ride", value: total === 0 ? "₹0" : `₹${Math.round(total / (transactions.length || 1))}`, sub: "per trip" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="layout-sidebar-grid sidebar-280">
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
            <div className="layout-table-scroll">
            <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--parchment)" }}>
                  {["Date", "Route", "Pax", "Amount", "Status"].map(h => (
                    <th key={h} style={{ padding: "13px 20px", textAlign: "left", fontSize: "0.75rem", color: "var(--mist)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid var(--sand)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                    <tr><td colSpan="5" style={{padding: 40, textAlign: 'center', color: 'var(--mist)'}}>No transactions found yet.</td></tr>
                ) : (
                    filtered.map((t, i) => (
                      <tr key={t.id} style={{ background: i % 2 === 0 ? "var(--cream)" : "var(--parchment)" }}>
                        <td style={{ padding: "14px 20px", fontSize: "0.82rem", color: "var(--mist)", whiteSpace: "nowrap" }}>{t.date}</td>
                        <td style={{ padding: "14px 20px", fontSize: "0.85rem", color: "var(--ink)", fontWeight: 500 }}>{t.from}</td>
                        <td style={{ padding: "14px 20px", fontSize: "0.85rem", color: "var(--mist)", textAlign: "center" }}>{t.passengers}</td>
                        <td style={{ padding: "14px 20px", fontFamily: "var(--font-serif)", fontSize: "1rem", color: "var(--ink)" }}>₹{t.amount}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <span className={`badge ${STATUS_MAP[t.status]?.cls || "badge-pending"}`}>
                            {STATUS_MAP[t.status]?.label || t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* ── Monthly chart ── */}
        <div className="info-card">
          <div className="info-card-title">Monthly Overview</div>
          <div className="earnings-bar-chart" style={{ marginBottom: 16 }}>
            {earningsChart.map((d, i) => (
              <div className="ebc-col" key={d.month}>
                <div className="ebc-amt">₹{(d.amt / 1000).toFixed(1)}k</div>
                <div className="ebc-bar-wrap">
                  <div className="ebc-bar" style={{ height: `${Math.round((d.amt / chartMax) * 100)}%`, opacity: i === earningsChart.length - 1 ? 1 : 0.55 }} />
                </div>
                <div className="ebc-day">{d.month}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--mist)", lineHeight: 1.7 }}>
            📈 Your earnings are based on successfully completed payments and confirmed rides.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
