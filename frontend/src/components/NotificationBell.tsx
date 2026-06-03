import { useState } from "react";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationBell() {
  const { notifications, connected, clear } = useNotifications();
  const [open, setOpen] = useState(false);

  const count = notifications.length;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={connected ? "Notifications" : "Reconnecting…"}
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          border: "1.5px solid var(--selected-color)",
          background: "transparent",
          cursor: "pointer",
          color: "var(--font-color)",
          fontSize: 16,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="bi-bell" />
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              background: "#dc2626",
              color: "white",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              minWidth: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
        {/* connection dot */}
        <span
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: connected ? "#16a34a" : "#9ca3af",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 46,
            width: 320,
            maxHeight: 400,
            overflowY: "auto",
            background: "var(--bg-color, white)",
            color: "var(--font-color, #111)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            zIndex: 1040,
            padding: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
            }}
          >
            <strong>Notifications</strong>
            {count > 0 && (
              <button
                onClick={clear}
                style={{
                  border: "none",
                  background: "none",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Clear
              </button>
            )}
          </div>

          {count === 0 ? (
            <p style={{ padding: "12px 10px", color: "#6b7280", margin: 0 }}>
              No notifications.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "10px",
                  borderRadius: 8,
                  marginBottom: 4,
                  background: "var(--hover-color, #f3f4f6)",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: "#374151" }}>
                  {n.message}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
