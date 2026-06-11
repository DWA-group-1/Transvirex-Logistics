import { useEffect, useState, useCallback } from "react";
import {
  getMyDeliveries,
  pickupDelivery,
  departDelivery,
  deliverDelivery,
  declareIncident,
  type DeliveryEnriched,
  type DeliveryStatus,
} from "../services/api";

// next action per status
type NextAction = { label: string; fn: (id: string) => Promise<any> };
const NEXT_ACTION: Partial<Record<DeliveryStatus, NextAction>> = {
  assigned: { label: "Confirm pickup", fn: pickupDelivery },
  picked_up: { label: "Depart / Start delivery", fn: departDelivery },
  in_transit: { label: "Mark delivered", fn: deliverDelivery },
};

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  created: "Created",
  assigned: "Assigned",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const TERMINAL: DeliveryStatus[] = ["delivered", "cancelled"];

export default function PlanRoutes() {
  const [deliveries, setDeliveries] = useState<DeliveryEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // incident modal state
  const [incidentFor, setIncidentFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await getMyDeliveries();
      setDeliveries(res.items);
    } catch (e: any) {
      setError(e.message || "Failed to load your deliveries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function advance(d: DeliveryEnriched) {
    const action = NEXT_ACTION[d.status];
    if (!action) return;
    setActing(d.id);
    setError(null);
    try {
      await action.fn(d.id);
      await load();
    } catch (e: any) {
      setError(e.message || "Action failed");
    } finally {
      setActing(null);
    }
  }

  const active = deliveries.filter((d) => !TERMINAL.includes(d.status));
  const done = deliveries.filter((d) => TERMINAL.includes(d.status));

  if (loading) return <p style={{ padding: 24 }}>Loading your route…</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 4 }}>My Route &amp; Assignments</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Your assigned deliveries — advance each as you complete it
      </p>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "10px 14px",
            borderRadius: 8,
            margin: "12px 0",
          }}
        >
          {error}
        </div>
      )}

      {flash && (
        <div
          style={{
            background: "#d1fae5",
            color: "#065f46",
            padding: "10px 14px",
            borderRadius: 8,
            margin: "12px 0",
          }}
        >
          {flash}
        </div>
      )}

      <h2>Active ({active.length})</h2>
      {active.length === 0 && (
        <p style={{ color: "#6b7280" }}>Nothing assigned right now.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: 16,
        }}
      >
        {active.map((d) => {
          const action = NEXT_ACTION[d.status];
          return (
            <div key={d.id} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                  {d.reference}
                </span>
                {d.has_open_incident && (
                  <span
                    style={{
                      background: "#fee2e2",
                      color: "#991b1b",
                      padding: "2px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      marginLeft: 8,
                    }}
                  >
                    ⚠ Incident
                  </span>
                )}
                <span style={badge(d.status)}>{STATUS_LABEL[d.status]}</span>
              </div>

              <div style={{ margin: "12px 0", fontSize: 14, lineHeight: 1.6 }}>
                <div>
                  <strong>To:</strong> {d.customer?.name ?? "—"}
                </div>
                <div>
                  <strong>Deliver:</strong> {d.delivery_address}, {d.city}{" "}
                  {d.zip_code}
                </div>
                <div>
                  <strong>From hub:</strong> {d.hub?.name ?? "—"}
                </div>
                <div>
                  <strong>Parcels:</strong> {d.parcel_count}
                  {d.weight_kg ? ` · ${d.weight_kg} kg` : ""}
                </div>
                {d.priority && d.priority !== "Normal" && (
                  <div>
                    <strong>Priority:</strong> {d.priority}
                  </div>
                )}
                {d.notes && (
                  <div style={{ color: "#6b7280" }}>Note: {d.notes}</div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {action && (
                  <button
                    onClick={() => advance(d)}
                    disabled={acting === d.id}
                    style={primaryBtn}
                  >
                    {acting === d.id ? "…" : action.label}
                  </button>
                )}
                <button
                  onClick={() => setIncidentFor(d.id)}
                  style={secondaryBtn}
                >
                  Report incident
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <>
          <h2 style={{ marginTop: 32 }}>Completed ({done.length})</h2>
          <div style={tableWrapper}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead>
              <tr
                style={{
                  background: "var(--selected-color)",
                  color: "var(--font-color)",
                  textAlign: "left",
                }}
              >
                <th style={th}>Delivery</th>
                <th style={th}>Customer</th>
                <th style={th}>Address</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {done.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={td}>
                    <span style={{ fontFamily: "monospace" }}>
                      {d.reference}
                    </span>
                  </td>
                  <td style={td}>{d.customer?.name ?? "—"}</td>
                  <td style={td}>{d.delivery_address}</td>
                  <td style={td}>{STATUS_LABEL[d.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {incidentFor && (
        <IncidentModal
          deliveryId={incidentFor}
          onClose={() => setIncidentFor(null)}
          onDone={() => {
            setIncidentFor(null);
            setFlash("Incident reported — dispatch has been notified.");
            setTimeout(() => setFlash(null), 4000);
            load();
          }}
        />
      )}
    </div>
  );
}

// ── Incident modal (uses the same pattern as FormModal; inline here for completeness) ──
function IncidentModal({
  deliveryId,
  onClose,
  onDone,
}: {
  deliveryId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState("damaged");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!description.trim()) {
      setErr("Describe the incident.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await declareIncident(deliveryId, {
        type,
        description: description.trim(),
        severity,
      });
      onDone();
    } catch (e: any) {
      setErr(e.message || "Failed to report incident");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalBox} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Report incident</h2>
        {err && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {err}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={lbl}>
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={inp}
            >
              <option value="damaged">Damaged parcel</option>
              <option value="failed_delivery">Failed delivery</option>
              <option value="accident">Accident</option>
              <option value="delay">Delay</option>
            </select>
          </label>
          <label style={lbl}>
            Severity
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={inp}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label style={lbl}>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inp, minHeight: 70 }}
              placeholder="What happened?"
            />
          </label>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
          }}
        >
          <button onClick={onClose} disabled={submitting} style={secondaryBtn}>
            Cancel
          </button>
          <button onClick={submit} disabled={submitting} style={primaryBtn}>
            {submitting ? "Reporting…" : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid color-mix(in srgb, var(--font-color) 16%, transparent)",
  borderRadius: 12,
  padding: 16,
  background: "var(--selected-color)",
  color: "var(--font-color)",
};

const primaryBtn: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "9px 14px",
  flex: "1 1 150px",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  background: "color-mix(in srgb, var(--font-color) 10%, transparent)",
  color: "var(--font-color)",
  border: "1px solid color-mix(in srgb, var(--font-color) 18%, transparent)",
  borderRadius: 6,
  padding: "9px 14px",
  fontWeight: 600,
  cursor: "pointer",
};


const tableWrapper: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const th: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 13,
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  color: "var(--font-color)",
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  paddingTop: 80,
  zIndex: 2000,
};

const modalBox: React.CSSProperties = {
  background: "var(--bg-color)",
  color: "var(--font-color)",
  border: "1px solid color-mix(in srgb, var(--font-color) 16%, transparent)",
  borderRadius: 12,
  width: 440,
  maxWidth: "92vw",
  padding: 24,
};

const lbl: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--font-color)",
};

const inp: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid color-mix(in srgb, var(--font-color) 20%, transparent)",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 400,
  background: "var(--selected-color)",
  color: "var(--font-color)",
};

function badge(status: DeliveryStatus): React.CSSProperties {
  const map: Record<DeliveryStatus, [string, string]> = {
    created: ["#e5e7eb", "#374151"],
    assigned: ["#dbeafe", "#1e40af"],
    picked_up: ["#fef3c7", "#92400e"],
    in_transit: ["#cffafe", "#155e75"],
    delivered: ["#d1fae5", "#065f46"],
    cancelled: ["#fee2e2", "#991b1b"],
  };

  const [bg, color] = map[status];

  return {
    background: bg,
    color,
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  };
}
