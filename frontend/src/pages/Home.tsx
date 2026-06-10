import { useEffect, useState } from "react";
import { useNotifications } from "../hooks/useNotifications";
import {
  getMyDeliveries,
  getDrivers,
  getDeliveries,
  getCurrentRole,
  type DeliveryEnriched,
  type DriverRef,
  type DeliveryStatus,
} from "../services/api";

// ── Types ─────────────────────────────────────────────────────────────────

interface DriverWithStatus extends DriverRef {
  status: "busy" | "free" | "incident";
  deliveryId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  created: "pending",
  assigned: "assigned",
  picked_up: "picked up",
  in_transit: "in transit",
  delivered: "delivered",
  cancelled: "cancelled",
};

const STATUS_CLASS: Record<DeliveryStatus, string> = {
  created: "s-created",
  assigned: "s-assigned",
  picked_up: "s-picked_up",
  in_transit: "s-in_transit",
  delivered: "s-delivered",
  cancelled: "s-cancelled",
};

function initials(d: DriverRef) {
  return `${d.first_name[0] ?? ""}${d.last_name[0] ?? ""}`.toUpperCase();
}

function isLate(d: DeliveryEnriched) {
  if (!d.expected_date) return false;
  return (
    new Date(d.expected_date) < new Date() &&
    d.status !== "delivered" &&
    d.status !== "cancelled"
  );
}

function formatExpected(d: DeliveryEnriched) {
  if (!d.expected_date) return "—";
  const dt = new Date(d.expected_date);
  const today = new Date();
  const isToday = dt.toDateString() === today.toDateString();
  return isToday
    ? `Today ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : dt.toLocaleDateString([], { day: "2-digit", month: "short" });
}

// ── Notification widget ───────────────────────────────────────────────────

function NotificationsCard() {
  const { notifications, clear } = useNotifications();
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const markRead = (id: number) =>
    setReadIds((prev) => new Set([...prev, id]));
  const markAll = () => setReadIds(new Set(notifications.map((n) => n.id)));

  const unread = notifications.filter((n) => !readIds.has(n.id));

  return (
    <section>
      <p className="tv-section-title">Notifications</p>
      <div className="tv-card">
        <div className="tv-card-header">
          <div className="tv-card-header-left">
            <i className="bi bi-envelope" aria-hidden="true" />
            Inbox
            {unread.length > 0 && (
              <span className="tv-badge tv-badge-info">{unread.length}</span>
            )}
          </div>
          {unread.length > 0 && (
            <button className="tv-link-btn" onClick={markAll}>
              Mark all as read
            </button>
          )}
        </div>

        <div className="tv-notif-list">
          {notifications.length === 0 ? (
            <p className="tv-empty">No notifications.</p>
          ) : (
            notifications.map((n) => {
              const isRead = readIds.has(n.id);
              return (
                <div key={n.id} className={`tv-notif-row${isRead ? "" : " unread"}`}>
                  <span
                    className={`tv-notif-dot${isRead ? " read" : ""}`}
                    aria-hidden="true"
                  />
                  <div className="tv-notif-body">
                    <p className="tv-notif-title">{n.title}</p>
                    <p className="tv-notif-msg">{n.message}</p>
                    <span className="tv-notif-time">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  {!isRead && (
                    <button
                      className="tv-btn-read"
                      onClick={() => markRead(n.id)}
                      aria-label="Mark as read"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

// ── Driver deliveries ─────────────────────────────────────────────────────

function DriverDeliveriesCard() {
  const [deliveries, setDeliveries] = useState<DeliveryEnriched[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyDeliveries()
      .then((res) =>
        setDeliveries(
          res.items.filter(
            (d) => d.status !== "delivered" && d.status !== "cancelled"
          )
        )
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <p className="tv-section-title">Upcoming deliveries</p>
      <div className="tv-card">
        <div className="tv-card-header">
          <div className="tv-card-header-left">
            <i className="bi bi-truck" aria-hidden="true" />
            My route today
          </div>
          {!loading && (
            <span className="tv-muted">{deliveries.length} stop{deliveries.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {loading ? (
          <p className="tv-empty">Loading…</p>
        ) : deliveries.length === 0 ? (
          <p className="tv-empty">No upcoming deliveries.</p>
        ) : (
          <div className="tv-delivery-list">
            {deliveries.map((d) => {
              const late = isLate(d);
              return (
                <div key={d.id} className="tv-delivery-row">
                  <span className={`tv-status ${STATUS_CLASS[d.status]}`}>
                    {STATUS_LABEL[d.status]}
                  </span>

                  <div className="tv-delivery-info">
                    <p className="tv-delivery-address">{d.delivery_address}</p>
                    <div className="tv-delivery-meta">
                      {d.customer && (
                        <span>
                          <i className="bi bi-building" aria-hidden="true" />
                          {d.customer.name}
                        </span>
                      )}
                      <span>
                        <i className="bi bi-box-seam" aria-hidden="true" />
                        {d.parcel_count} parcel{d.parcel_count !== 1 ? "s" : ""}
                        {d.weight_kg != null ? ` · ${d.weight_kg} kg` : ""}
                      </span>
                      <span>
                        <i className="bi bi-tag" aria-hidden="true" />
                        {d.service_type}
                      </span>
                    </div>
                  </div>

                  <span className={`tv-expected${late ? " late" : ""}`}>
                    {late && <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />}
                    {formatExpected(d)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Manager fleet overview ────────────────────────────────────────────────

function ManagerFleetCard() {
  const [drivers, setDrivers] = useState<DriverWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDrivers(), getDeliveries({ status: "in_transit" })])
      .then(([driversRes, deliveriesRes]) => {
        const activeDeliveries = deliveriesRes.items;
        const enriched: DriverWithStatus[] = driversRes.items.map((driver) => {
          const activeDelivery = activeDeliveries.find(
            (d) => d.assigned_driver_id === driver.id
          );
          const hasIncident = activeDelivery?.has_open_incident ?? false;
          return {
            ...driver,
            status: hasIncident ? "incident" : activeDelivery ? "busy" : "free",
            deliveryId: activeDelivery?.id,
          };
        });
        setDrivers(enriched);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const busy = drivers.filter((d) => d.status === "busy").length;
  const free = drivers.filter((d) => d.status === "free").length;
  const incidents = drivers.filter((d) => d.status === "incident").length;

  const BADGE: Record<string, string> = {
    busy: "tv-driver-badge-busy",
    free: "tv-driver-badge-free",
    incident: "tv-driver-badge-incident",
  };
  const BADGE_LABEL: Record<string, string> = {
    busy: "On route",
    free: "Available",
    incident: "Incident",
  };

  return (
    <section>
      <p className="tv-section-title">Driver status</p>
      <div className="tv-card">
        <div className="tv-card-header">
          <div className="tv-card-header-left">
            <i className="bi bi-people" aria-hidden="true" />
            Fleet overview
          </div>
          {!loading && (
            <span className="tv-muted">
              {busy} on route · {free} available{incidents > 0 ? ` · ${incidents} incident` : ""}
            </span>
          )}
        </div>

        {loading ? (
          <p className="tv-empty">Loading…</p>
        ) : drivers.length === 0 ? (
          <p className="tv-empty">No active drivers.</p>
        ) : (
          <div className="tv-drivers-grid">
            {drivers.map((d) => (
              <div key={d.id} className="tv-driver-card">
                <div className="tv-driver-avatar" aria-hidden="true">
                  {initials(d)}
                </div>
                <p className="tv-driver-name">
                  {d.first_name} {d.last_name}
                </p>
                {d.phone && <p className="tv-driver-hub">{d.phone}</p>}
                <span className={`tv-driver-badge ${BADGE[d.status]}`}>
                  {BADGE_LABEL[d.status]}
                  {d.deliveryId ? ` · ${d.deliveryId.slice(0, 8)}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────

function Home() {
  const role = getCurrentRole();
  const isDriver = role === "driver";
  const isManager = role === "manager" || role === "dispatcher";

  return (
    <>
      <style>{CSS}</style>
      <div className="tv-dash">
        <section className="tv-welcome">
          <h1>Welcome to Transvirex web app 👋</h1>
          <p>
            If you have any question, our AI Agent 🤖 could probably answer it!
          </p>
        </section>

        <div className="tv-widget-grid">
          <NotificationsCard />
          {isDriver && <DriverDeliveriesCard />}
          {isManager && <ManagerFleetCard />}
        </div>
      </div>
    </>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────

const CSS = `
.tv-dash {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.tv-welcome {
  padding: 1.75rem 2rem;
  border-radius: 16px;
  background: color-mix(in srgb, var(--main-color) 8%, var(--bg-color));
  border: 0.5px solid var(--selected-color);
}

.tv-welcome h1 {
  margin: 0 0 8px;
  font-size: 32px;
  line-height: 1.15;
  font-weight: 700;
  color: var(--font-color);
}

.tv-welcome p {
  margin: 0;
  font-size: 15px;
  color: var(--font-color);
  opacity: .65;
}

.tv-widget-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.tv-widget-grid > section {
  min-width: 0;
}

@media (max-width: 850px) {
  .tv-widget-grid {
    grid-template-columns: 1fr;
  }

  .tv-welcome h1 {
    font-size: 26px;
  }
}

.tv-section-title {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--font-color);
  opacity: .5;
  margin: 0 0 8px;
}

.tv-card {
  background: var(--bg-color);
  border: 0.5px solid var(--selected-color);
  border-radius: 12px;
  overflow: hidden;
}

.tv-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px 11px;
  border-bottom: 0.5px solid var(--selected-color);
}

.tv-card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--font-color);
}

.tv-muted { font-size: 12px; opacity: .5; color: var(--font-color); }
.tv-link-btn { font-size: 12px; background: none; border: none; cursor: pointer; color: var(--main-color); padding: 0; }
.tv-link-btn:hover { text-decoration: underline; }
.tv-empty { padding: 20px 16px; text-align: center; font-size: 13px; opacity: .45; color: var(--font-color); margin: 0; }

/* badge pill */
.tv-badge { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 999px; margin-left: 4px; }
.tv-badge-info { background: #dbeafe; color: #1d4ed8; }

/* notifications */
.tv-notif-list { display: flex; flex-direction: column; }
.tv-notif-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 11px 16px;
  border-bottom: 0.5px solid var(--selected-color);
  transition: background .1s;
}
.tv-notif-row:last-child { border-bottom: none; }
.tv-notif-row:hover { background: color-mix(in srgb, var(--font-color) 4%, transparent); }
.tv-notif-row.unread { background: color-mix(in srgb, var(--main-color) 7%, transparent); }
.tv-notif-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--main-color); flex-shrink: 0; margin-top: 5px; }
.tv-notif-dot.read { background: transparent; border: 1.5px solid var(--selected-color); }
.tv-notif-body { flex: 1; min-width: 0; }
.tv-notif-title { font-size: 13px; font-weight: 500; color: var(--font-color); margin: 0 0 2px; }
.tv-notif-msg { font-size: 12px; color: var(--font-color); opacity: .6; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tv-notif-time { font-size: 11px; opacity: .4; color: var(--font-color); }
.tv-btn-read {
  font-size: 11px; background: none; border: 0.5px solid var(--selected-color);
  border-radius: 6px; padding: 3px 8px; cursor: pointer; color: var(--font-color);
  opacity: .7; white-space: nowrap; flex-shrink: 0;
}
.tv-btn-read:hover { opacity: 1; }

/* deliveries */
.tv-delivery-list { display: flex; flex-direction: column; }
.tv-delivery-row {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 16px;
  border-bottom: 0.5px solid var(--selected-color);
}
.tv-delivery-row:last-child { border-bottom: none; }
.tv-delivery-row:hover { background: color-mix(in srgb, var(--font-color) 4%, transparent); }
.tv-status { font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
.s-created   { background: color-mix(in srgb, var(--font-color) 10%, transparent); color: var(--font-color); }
.s-assigned  { background: #fef3c7; color: #92400e; }
.s-picked_up { background: #dbeafe; color: #1e40af; }
.s-in_transit { background: #d1fae5; color: #065f46; }
.s-delivered { background: #d1fae5; color: #065f46; }
.s-cancelled { background: #fee2e2; color: #991b1b; }
.tv-delivery-info { flex: 1; min-width: 0; }
.tv-delivery-address { font-size: 13px; font-weight: 500; color: var(--font-color); margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tv-delivery-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--font-color); opacity: .6; }
.tv-delivery-meta span { display: flex; align-items: center; gap: 3px; }
.tv-expected { font-size: 12px; color: var(--font-color); opacity: .5; white-space: nowrap; flex-shrink: 0; display: flex; align-items: center; gap: 4px; }
.tv-expected.late { opacity: 1; color: #dc2626; font-weight: 500; }

/* drivers */
.tv-drivers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; padding: 14px 16px; }
.tv-driver-card { border: 0.5px solid var(--selected-color); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 5px; }
.tv-driver-card:hover { background: color-mix(in srgb, var(--font-color) 4%, transparent); }
.tv-driver-avatar { width: 34px; height: 34px; border-radius: 50%; background: color-mix(in srgb, var(--main-color) 15%, transparent); color: var(--main-color); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; }
.tv-driver-name { font-size: 13px; font-weight: 500; color: var(--font-color); margin: 0; line-height: 1.3; }
.tv-driver-hub { font-size: 11px; color: var(--font-color); opacity: .45; margin: 0; }
.tv-driver-badge { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 999px; display: inline-block; }
.tv-driver-badge-busy     { background: #d1fae5; color: #065f46; }
.tv-driver-badge-free     { background: color-mix(in srgb, var(--font-color) 10%, transparent); color: var(--font-color); }
.tv-driver-badge-incident { background: #fee2e2; color: #991b1b; }
`;

export default Home;