import { useEffect, useState, useCallback } from "react";
import CreateOrderModal from "./CreateOrderModal";
import {
  getDeliveries,
  getDrivers,
  assignDriver,
  getAuthToken,
  type DeliveryEnriched,
  type DeliveryStatus,
  type DriverRef,
} from "../services/api";

const API_BASE_URL = "http://localhost:8000";

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  created: "Created",
  assigned: "Assigned",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_STYLES: Record<DeliveryStatus, { bg: string; color: string }> = {
  created: { bg: "#e5e7eb", color: "#374151" },
  assigned: { bg: "#dbeafe", color: "#1e40af" },
  picked_up: { bg: "#fef3c7", color: "#92400e" },
  in_transit: { bg: "#cffafe", color: "#155e75" },
  delivered: { bg: "#d1fae5", color: "#065f46" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const s = STATUS_STYLES[status];

  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function driverName(d: DeliveryEnriched): string {
  if (!d.driver) return "—";
  return `${d.driver.first_name} ${d.driver.last_name}`;
}

async function transitionDelivery(
  deliveryId: string,
  action: "pickup" | "depart" | "deliver",
) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${API_BASE_URL}/delivery/deliveries/${deliveryId}/${action}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to ${action} delivery: ${response.status} ${body}`);
  }

  return response.json();
}

export default function TrackOrders() {
  const [deliveries, setDeliveries] = useState<DeliveryEnriched[]>([]);
  const [driversByHub, setDriversByHub] = useState<Record<string, DriverRef[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const del = await getDeliveries({ limit: 100 }); // no Promise.all wrapper
      setDeliveries(del.items);
    } catch (e: any) {
      setError(e.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Lazily fetch each hub's drivers once, when a "created" delivery for that hub is shown.
  const ensureHubDrivers = useCallback(
    async (hubId: string) => {
      if (!hubId || driversByHub[hubId]) return;
      try {
        const res = await getDrivers(hubId);
        setDriversByHub((m) => ({ ...m, [hubId]: res.items }));
      } catch {
        /* leave undefined -> dropdown shows "Loading…"; or set [] to show empty state */
      }
    },
    [driversByHub],
  );

  useEffect(() => {
    deliveries
      .filter((d) => d.status === "created")
      .forEach((d) => ensureHubDrivers(d.hub_id));
  }, [deliveries, ensureHubDrivers]);

  const total = deliveries.length;
  const completed = deliveries.filter((d) => d.status === "delivered").length;
  const inTransit = deliveries.filter(
    (d) => d.status === "in_transit" || d.status === "picked_up",
  ).length;
  const unassigned = deliveries.filter((d) => d.status === "created").length;

  async function handleAssign(deliveryId: string, driverId: string) {
    if (!driverId) return;
    setAssigning(deliveryId);
    try {
      await assignDriver(deliveryId, driverId);
      await load();
    } catch (e: any) {
      setError(e.message || "Assignment failed");
    } finally {
      setAssigning(null);
    }
  }

  async function handleTransition(
    deliveryId: string,
    action: "pickup" | "depart" | "deliver",
  ) {
    setTransitioning(deliveryId);
    try {
      await transitionDelivery(deliveryId, action);
      await load();
    } catch (e: any) {
      setError(e.message || "Status update failed");
    } finally {
      setTransitioning(null);
    }
  }

  function renderAction(d: DeliveryEnriched) {
    if (d.status === "created") {
      const hubDrivers = driversByHub[d.hub_id];
      if (hubDrivers && hubDrivers.length === 0) {
        return (
          <span style={{ color: "#b45309", fontSize: 13 }}>
            No drivers assigned to this hub
          </span>
        );
      }
      return (
        <select
          disabled={assigning === d.id || !hubDrivers}
          defaultValue=""
          onChange={(e) => handleAssign(d.id, e.target.value)}
        >
          <option value="" disabled>
            {assigning === d.id
              ? "Assigning…"
              : hubDrivers
                ? "Assign driver…"
                : "Loading…"}
          </option>
          {(hubDrivers ?? []).map((drv) => (
            <option key={drv.id} value={drv.id}>
              {drv.first_name} {drv.last_name}
            </option>
          ))}
        </select>
      );
    }

    if (d.status === "assigned") {
      return (
        <ActionButton
          disabled={transitioning === d.id}
          onClick={() => handleTransition(d.id, "pickup")}
        >
          Pick up
        </ActionButton>
      );
    }
    if (d.status === "picked_up") {
      return (
        <ActionButton
          disabled={transitioning === d.id}
          onClick={() => handleTransition(d.id, "depart")}
        >
          Depart
        </ActionButton>
      );
    }
    if (d.status === "in_transit") {
      return (
        <ActionButton
          disabled={transitioning === d.id}
          onClick={() => handleTransition(d.id, "deliver")}
        >
          Deliver
        </ActionButton>
      );
    }
    return "—";
  }

  if (loading) return <p style={{ padding: 24 }}>Loading deliveries…</p>;

  return (
    <>
      {/* Responsive styles injected once */}
      <style>{`
        .track-orders { padding: clamp(12px, 4vw, 24px); }
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 4 }}>Dispatcher Dashboard — Order Tracking</h1>

      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Create assignments and track delivery status
      </p>

      <button
        onClick={() => setShowCreate(true)}
        style={{
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          padding: "9px 16px",
          fontWeight: 600,
          cursor: "pointer",
          margin: "12px 0",
        }}
      >
        + Create New Order
      </button>

        .track-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin: 20px 0;
        }

        /* Tablet */
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .desktop-table { display: none; }
          .mobile-cards  { display: flex; flex-direction: column; gap: 12px; }
        }

        /* Desktop: hide mobile cards */
        @media (min-width: 769px) {
          .desktop-table { display: table; }
          .mobile-cards  { display: none; }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
        }

        .orders-table th,
        .orders-table td {
          padding: 10px 12px;
          text-align: left;
          white-space: nowrap;
        }

        .orders-table th {
          font-size: 13px;
          background: var(--selected-color);
          color: var(--font-color);
        }

        .orders-table tbody tr {
          border-bottom: 1px solid #e5e7eb;
        }

        /* Scrollable table wrapper on mid-sizes */
        .table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
        }
      `}</style>

      <div className="track-orders">
        <div className="track-header">
          <div>
            <h1 style={{ marginBottom: 4, marginTop: 0 }}>
              Dispatcher Dashboard — Order Tracking
            </h1>
            <p style={{ color: "#6b7280", margin: 0 }}>
              Create assignments and track delivery status
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "9px 16px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            + Create New Order
          </button>
        </div>

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

        <div className="stats-grid">
          <StatCard label="Total Orders" value={total} />
          <StatCard label="Completed" value={completed} />
          <StatCard label="In Transit" value={inTransit} />
          <StatCard label="Unassigned" value={unassigned} />
        </div>

        <h2 style={{ marginBottom: 12 }}>Active Orders</h2>

        {/* ── Desktop table ── */}
        <div className="table-scroll">
          <table className="orders-table desktop-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Driver</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontFamily: "monospace" }}>{d.id.slice(0, 8)}</td>
                  <td>{d.customer?.name ?? "—"}</td>
                  <td>{d.delivery_address}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>{d.priority}</td>
                  <td>{driverName(d)}</td>
                  <td>
                    {d.status === "created" ? (
                      <select
                        disabled={assigning === d.id}
                        defaultValue=""
                        onChange={(e) => handleAssign(d.id, e.target.value)}
                      >
                        <option value="" disabled>
                          {assigning === d.id ? "Assigning…" : "Assign driver…"}
                        </option>
                        {drivers.map((drv) => (
                          <option key={drv.id} value={drv.id}>
                            {drv.first_name} {drv.last_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={7}>No deliveries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile cards ── */}
        <div className="mobile-cards">
          {deliveries.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No deliveries yet.</p>
          ) : (
            deliveries.map((d) => (
              <DeliveryCard
                key={d.id}
                d={d}
                drivers={drivers}
                assigning={assigning}
                onAssign={handleAssign}
              />
            ))
          )}
        </div>
      </div>

      <CreateOrderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />
    </>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        background: disabled ? "#9ca3af" : "#2563eb",
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "6px 12px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {disabled ? "Updating…" : children}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border:
          "1px solid color-mix(in srgb, var(--font-color) 12%, transparent)",
        borderRadius: 8,
        padding: 16,
        background: "var(--selected-color)",
        color: "var(--font-color)",
      }}
    >
      <div
        style={{
          color: "color-mix(in srgb, var(--font-color) 70%, transparent)",
          fontSize: 14,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}