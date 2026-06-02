import { useEffect, useState, useCallback } from "react";
import CreateOrderModal from "./CreateOrderModal";
import {
  getDeliveries,
  getDrivers,
  assignDriver,
  type DeliveryEnriched,
  type DeliveryStatus,
  type DriverRef,
} from "../services/api";

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

export default function TrackOrders() {
  const [deliveries, setDeliveries] = useState<DeliveryEnriched[]>([]);
  const [drivers, setDrivers] = useState<DriverRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [del, drv] = await Promise.all([
        getDeliveries({ limit: 100 }),
        getDrivers(),
      ]);
      setDeliveries(del.items);
      setDrivers(drv.items);
    } catch (e: any) {
      setError(e.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Stats derived from real data
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
      await load(); // refresh to show the new assignment + status
    } catch (e: any) {
      setError(e.message || "Assignment failed");
    } finally {
      setAssigning(null);
    }
  }

  if (loading) return <p style={{ padding: 24 }}>Loading deliveries…</p>;

  return (
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

      {/* Stats — all derived from the real delivery list */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          margin: "20px 0",
        }}
      >
        <StatCard label="Total Orders" value={total} />
        <StatCard label="Completed" value={completed} />
        <StatCard label="In Transit" value={inTransit} />
        <StatCard label="Unassigned" value={unassigned} />
      </div>

      <h2>Active Orders</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr
            style={{ background: "#1f2937", color: "white", textAlign: "left" }}
          >
            <Th>Order ID</Th>
            <Th>Customer</Th>
            <Th>Address</Th>
            <Th>Status</Th>
            <Th>Priority</Th>
            <Th>Driver</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => (
            <tr key={d.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <Td mono>{d.id.slice(0, 8)}</Td>
              <Td>{d.customer?.name ?? "—"}</Td>
              <Td>{d.delivery_address}</Td>
              <Td>
                <StatusBadge status={d.status} />
              </Td>
              <Td>{d.priority}</Td>
              <Td>{driverName(d)}</Td>
              <Td>
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
              </Td>
            </tr>
          ))}
          {deliveries.length === 0 && (
            <tr>
              <Td colSpan={7}>No deliveries yet.</Td>
            </tr>
          )}
        </tbody>
      </table>
      <CreateOrderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load} // reuse the existing load() to refresh the table
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        background: "white",
      }}
    >
      <div style={{ color: "#6b7280", fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "10px 12px", fontSize: 13 }}>{children}</th>;
}

function Td({
  children,
  mono,
  colSpan,
}: {
  children: React.ReactNode;
  mono?: boolean;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: "10px 12px",
        fontFamily: mono ? "monospace" : undefined,
      }}
    >
      {children}
    </td>
  );
}
