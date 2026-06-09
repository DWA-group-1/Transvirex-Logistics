import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { getCurrentKpis, getKpiTrend, type KpiValues } from "../services/api";

const GREEN = "#16a34a";
const BLUE = "#2563eb";
const AMBER = "#d97706";

type TrendRow = KpiValues & { label: string };

function fmt(n: number | null | undefined, suffix = ""): string {
  if (n === null || n === undefined) return "—";
  return `${Number(n).toLocaleString()}${suffix}`;
}

export default function Reports() {
  const [current, setCurrent] = useState<KpiValues | null>(null);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [cur, tr] = await Promise.all([
          getCurrentKpis(),
          getKpiTrend(12),
        ]);
        setCurrent(cur);
        setTrend(
          tr.months.map((m) => ({ ...m, label: m.period_month.slice(0, 7) })),
        );
      } catch (e: any) {
        setError(e.message || "Failed to load KPIs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = current
    ? [
        {
          label: "Deliveries (this month)",
          value: fmt(current.total_deliveries),
          icon: "bi-truck",
        },
        {
          label: "On-time",
          value: fmt(current.on_time_pct, "%"),
          icon: "bi-clock-history",
        },
        {
          label: "Avg delivery time",
          value: fmt(current.avg_delivery_time_h, " h"),
          icon: "bi-hourglass-split",
        },
        {
          label: "Revenue",
          value:
            current.revenue != null
              ? `€${Number(current.revenue).toLocaleString()}`
              : "—",
          icon: "bi-currency-euro",
        },
        {
          label: "Active drivers",
          value: fmt(current.active_drivers),
          icon: "bi-people",
        },
        {
          label: "Incidents",
          value: fmt(current.incidents_count),
          icon: "bi-exclamation-triangle",
        },
      ]
    : [];

  return (
    <div style={pageStyle}>
      <div>
        <h1 style={{ margin: 0, color: "var(--font-color)" }}>Reports</h1>
        <p style={mutedText}>
          Operational KPIs · live current month, historical trend
        </p>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {loading ? (
        <p style={mutedText}>Loading…</p>
      ) : (
        <>
          <div style={cardGrid}>
            {cards.map((c) => (
              <div key={c.label} style={cardStyle}>
                <i
                  className={`bi ${c.icon}`}
                  style={cardIcon}
                  aria-hidden="true"
                />
                <div>
                  <div style={cardValue}>{c.value}</div>
                  <div style={cardLabel}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={chartCard}>
            <h2 style={chartTitle}>Revenue by month</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={axisTick} />
                <YAxis tick={axisTick} />
                <Tooltip />
                <Bar
                  dataKey="revenue"
                  name="Revenue (€)"
                  fill={GREEN}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={chartRow}>
            <div style={chartCard}>
              <h2 style={chartTitle}>On-time delivery %</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" tick={axisTick} />
                  <YAxis domain={[80, 100]} tick={axisTick} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="on_time_pct"
                    name="On-time %"
                    stroke={BLUE}
                    strokeWidth={2}
                    connectNulls
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={chartCard}>
              <h2 style={chartTitle}>Deliveries & incidents</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" tick={axisTick} />
                  <YAxis tick={axisTick} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_deliveries"
                    name="Deliveries"
                    stroke={GREEN}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="incidents_count"
                    name="Incidents"
                    stroke={AMBER}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {current && current.on_time_pct === null && (
            <p style={mutedText}>
              On-time % for the current month populates once deliveries carry an
              expected delivery date.
            </p>
          )}
        </>
      )}
    </div>
  );
}

const gridColor = "color-mix(in srgb, var(--font-color) 12%, transparent)";

const pageStyle: React.CSSProperties = {
  padding: 24,
  color: "var(--font-color)",
};

const mutedText: React.CSSProperties = {
  color: "color-mix(in srgb, var(--font-color) 65%, transparent)",
  margin: "4px 0 0",
};

const errorBox: React.CSSProperties = {
  background: "color-mix(in srgb, #ef4444 16%, var(--bg-color))",
  color: "#ef4444",
  border: "1px solid color-mix(in srgb, #ef4444 40%, transparent)",
  padding: "10px 14px",
  borderRadius: 8,
  margin: "16px 0",
};

const cardGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 16,
  margin: "20px 0",
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "18px 20px",
  borderRadius: 14,
  background: "var(--bg-color)",
  border: "1px solid var(--selected-color)",
  boxShadow: "0 2px 12px color-mix(in srgb, var(--font-color) 6%, transparent)",
};

const cardIcon: React.CSSProperties = {
  fontSize: 24,
  color: "var(--main-color)",
  opacity: 0.9,
};

const cardValue: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: "var(--font-color)",
  lineHeight: 1.1,
};

const cardLabel: React.CSSProperties = {
  fontSize: 12,
  color: "color-mix(in srgb, var(--font-color) 60%, transparent)",
  marginTop: 2,
};

const chartCard: React.CSSProperties = {
  flex: 1,
  minWidth: 280,
  padding: 20,
  borderRadius: 14,
  background: "var(--bg-color)",
  border: "1px solid var(--selected-color)",
  marginBottom: 20,
};

const chartRow: React.CSSProperties = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
};

const chartTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 15,
  fontWeight: 600,
  color: "var(--font-color)",
};

const axisTick = {
  fill: "color-mix(in srgb, var(--font-color) 65%, transparent)",
  fontSize: 12,
};
