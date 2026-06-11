import { useEffect, useState, useCallback, useMemo } from "react";
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
import { useSort } from "../hooks/useSort";

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

// Logical (not alphabetical) ordering for priority sorting.
const PRIORITY_RANK: Record<string, number> = { High: 0, Normal: 1, Low: 2 };

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
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(
    `${API_BASE_URL}/delivery/deliveries/${deliveryId}/${action}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to ${action} delivery: ${response.status} ${body}`);
  }
  return response.json();
}

// ─── Action renderer (shared between table and card) ─────────────────────────
function DeliveryAction({
  d,
  driversByHub,
  assigning,
  transitioning,
  onAssign,
  onTransition,
}: {
  d: DeliveryEnriched;
  driversByHub: Record<string, DriverRef[]>;
  assigning: string | null;
  transitioning: string | null;
  onAssign: (id: string, driverId: string) => void;
  onTransition: (id: string, action: "pickup" | "depart" | "deliver") => void;
}) {
  if (d.status === "created") {
    const hubDrivers = driversByHub[d.hub_id];
    if (hubDrivers && hubDrivers.length === 0) {
      return (
        <span style={{ color: "#b45309", fontSize: 13 }}>
          No drivers at this hub
        </span>
      );
    }
    return (
      <select
        disabled={assigning === d.id || !hubDrivers}
        defaultValue=""
        onChange={(e) => onAssign(d.id, e.target.value)}
        style={{
          maxWidth: "100%",
          padding: "5px 8px",
          borderRadius: 6,
          fontSize: 13,
        }}
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
        onClick={() => onTransition(d.id, "pickup")}
      >
        Pick up
      </ActionButton>
    );
  }
  if (d.status === "picked_up") {
    return (
      <ActionButton
        disabled={transitioning === d.id}
        onClick={() => onTransition(d.id, "depart")}
      >
        Depart
      </ActionButton>
    );
  }
  if (d.status === "in_transit") {
    return (
      <ActionButton
        disabled={transitioning === d.id}
        onClick={() => onTransition(d.id, "deliver")}
      >
        Deliver
      </ActionButton>
    );
  }
  return <>—</>;
}

// ─── Mobile card ─────────────────────────────────────────────────────────────
function DeliveryCard({
  d,
  driversByHub,
  assigning,
  transitioning,
  onAssign,
  onTransition,
}: {
  d: DeliveryEnriched;
  driversByHub: Record<string, DriverRef[]>;
  assigning: string | null;
  transitioning: string | null;
  onAssign: (id: string, driverId: string) => void;
  onTransition: (id: string, action: "pickup" | "depart" | "deliver") => void;
}) {
  return (
    <div
      style={{
        border:
          "1px solid color-mix(in srgb, var(--font-color) 12%, transparent)",
        borderRadius: 8,
        padding: "14px 16px",
        background: "var(--selected-color)",
        color: "var(--font-color)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <span style={{ fontFamily: "monospace", fontSize: 13, opacity: 0.65 }}>
          #{d.reference ?? d.id.slice(0, 8)}
        </span>
        <StatusBadge status={d.status} />
      </div>

      <div style={{ fontWeight: 600, fontSize: 15 }}>
        {d.customer?.name ?? "—"}
      </div>
      <div style={{ fontSize: 13, opacity: 0.75 }}>{d.delivery_address}</div>

      <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
        <span>
          <strong>Priority:</strong> {d.priority}
        </span>
        <span>
          <strong>Driver:</strong> {driverName(d)}
        </span>
      </div>

      <div style={{ marginTop: 2 }}>
        <DeliveryAction
          d={d}
          driversByHub={driversByHub}
          assigning={assigning}
          transitioning={transitioning}
          onAssign={onAssign}
          onTransition={onTransition}
        />
      </div>
    </div>
  );
}

// ─── Sortable header cell (table only) ───────────────────────────────────────
function SortTh({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  col: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSort: (col: string) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      {label}
      <span style={{ marginLeft: 6, opacity: active ? 1 : 0.3, fontSize: 11 }}>
        {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </th>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
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
      const del = await getDeliveries({ limit: 100 });
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

  const ensureHubDrivers = useCallback(
    async (hubId: string) => {
      if (!hubId || driversByHub[hubId]) return;
      try {
        const res = await getDrivers(hubId);
        setDriversByHub((m) => ({ ...m, [hubId]: res.items }));
      } catch {
        /* leave undefined */
      }
    },
    [driversByHub],
  );

  useEffect(() => {
    deliveries
      .filter((d) => d.status === "created")
      .forEach((d) => ensureHubDrivers(d.hub_id));
  }, [deliveries, ensureHubDrivers]);

  const sortAccessors = useMemo(
    () => ({
      reference: (d: DeliveryEnriched) => d.reference ?? d.id,
      customer: (d: DeliveryEnriched) => d.customer?.name,
      address: (d: DeliveryEnriched) => d.delivery_address,
      status: (d: DeliveryEnriched) => d.status,
      priority: (d: DeliveryEnriched) => PRIORITY_RANK[d.priority] ?? 9,
      driver: (d: DeliveryEnriched) =>
        d.driver ? `${d.driver.first_name} ${d.driver.last_name}` : null,
    }),
    [],
  );
  const { sorted, sortKey, sortDir, toggle } = useSort(
    deliveries,
    sortAccessors,
  );

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

  if (loading) return <p style={{ padding: 24 }}>Loading deliveries…</p>;

  const actionProps = {
    driversByHub,
    assigning,
    transitioning,
    onAssign: handleAssign,
    onTransition: handleTransition,
  };

  return (
    <>
      <style>{`
        .track-orders { padding: clamp(12px, 4vw, 24px); }

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

        .table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
        }

        .orders-table th {
          padding: 10px 12px;
          font-size: 13px;
          text-align: left;
          background: var(--selected-color);
          color: var(--font-color);
          white-space: nowrap;
        }

        .orders-table td {
          padding: 10px 12px;
        }

        .orders-table tbody tr {
          border-bottom: 1px solid #e5e7eb;
        }

        .mobile-cards { display: none; flex-direction: column; gap: 12px; }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .desktop-table { display: none; }
          .mobile-cards { display: flex; }
        }

        @media (max-width: 480px) {
          .stats-grid { gap: 10px; }
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

        {/* Desktop table */}
        <div className="table-scroll desktop-table">
          <table className="orders-table">
            <thead>
              <tr>
                <SortTh
                  label="Order ID"
                  col="reference"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <SortTh
                  label="Customer"
                  col="customer"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <SortTh
                  label="Address"
                  col="address"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <SortTh
                  label="Status"
                  col="status"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <SortTh
                  label="Priority"
                  col="priority"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <SortTh
                  label="Driver"
                  col="driver"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontFamily: "monospace" }}>
                    {d.reference ?? d.id.slice(0, 8)}
                  </td>
                  <td>{d.customer?.name ?? "—"}</td>
                  <td>{d.delivery_address}</td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td>{d.priority}</td>
                  <td>{driverName(d)}</td>
                  <td>
                    <DeliveryAction d={d} {...actionProps} />
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "10px 12px" }}>
                    No deliveries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mobile-cards">
          {deliveries.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No deliveries yet.</p>
          ) : (
            sorted.map((d) => (
              <DeliveryCard key={d.id} d={d} {...actionProps} />
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
      <div
        style={{ color: "var(--font-color)", fontSize: 28, fontWeight: 700 }}
      >
        {value}
      </div>
    </div>
  );
}

