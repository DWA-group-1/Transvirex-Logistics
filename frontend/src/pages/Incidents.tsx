import { useEffect, useState, useCallback } from "react";
import {
  getIncidents,
  resolveIncident,
  type IncidentWithDelivery,
} from "../services/api";
import FormModal from "../components/FormModal";
import {
  Labeled,
  inputStyle,
  Th,
  Td,
  pageHeaderRow,
} from "../components/FormBits";

const SEV_STYLE: Record<string, { bg: string; color: string }> = {
  low: { bg: "#dbeafe", color: "#1e40af" },
  medium: { bg: "#fef3c7", color: "#92400e" },
  high: { bg: "#fee2e2", color: "#991b1b" },
};

export default function Incidents() {
  const [incidents, setIncidents] = useState<IncidentWithDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");

  const [resolving, setResolving] = useState<IncidentWithDelivery | null>(null);
  const [resolution, setResolution] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await getIncidents(
        filter === "all" ? undefined : { status: filter },
      );
      setIncidents(res);
    } catch (e: any) {
      setError(e.message || "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  function openResolve(inc: IncidentWithDelivery) {
    setResolving(inc);
    setResolution("");
    setModalError(null);
  }

  async function submitResolve() {
    if (!resolving) return;
    if (!resolution.trim()) {
      setModalError("A resolution note is required.");
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      await resolveIncident(resolving.id, resolution.trim());
      setResolving(null);
      await load();
    } catch (e: any) {
      setModalError(e.message || "Failed to resolve");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={pageHeaderRow}>
        <div>
          <h1 style={{ margin: 0 }}>Incidents</h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0" }}>
            Review and resolve reported incidents
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["open", "resolved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: filter === f ? "#2563eb" : "white",
                color: filter === f ? "white" : "#374151",
                cursor: "pointer",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "#1f2937",
                color: "white",
                textAlign: "left",
              }}
            >
              <Th>Type</Th>
              <Th>Severity</Th>
              <Th>Description</Th>
              <Th>Delivery</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => {
              const sev = SEV_STYLE[inc.severity] ?? SEV_STYLE.medium;
              return (
                <tr key={inc.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <Td>{inc.type}</Td>
                  <Td>
                    <span
                      style={{
                        background: sev.bg,
                        color: sev.color,
                        padding: "2px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {inc.severity}
                    </span>
                  </Td>
                  <Td>{inc.description}</Td>
                  <Td>
                    {inc.delivery_address ?? "—"}
                    {inc.delivery_city ? `, ${inc.delivery_city}` : ""}
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "#9ca3af",
                      }}
                    >
                      {inc.delivery_id.slice(0, 8)}
                    </div>
                  </Td>
                  <Td>
                    {inc.status === "open" ? (
                      <span style={{ color: "#991b1b", fontWeight: 600 }}>
                        Open
                      </span>
                    ) : (
                      <span style={{ color: "#065f46", fontWeight: 600 }}>
                        Resolved
                      </span>
                    )}
                  </Td>
                  <Td>
                    {inc.status === "open" ? (
                      <button
                        onClick={() => openResolve(inc)}
                        style={{
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Resolve
                      </button>
                    ) : (
                      <span style={{ color: "#6b7280", fontSize: 13 }}>
                        {inc.resolution}
                      </span>
                    )}
                  </Td>
                </tr>
              );
            })}
            {incidents.length === 0 && (
              <tr>
                <Td colSpan={6}>No incidents.</Td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <FormModal
        open={resolving !== null}
        title="Resolve incident"
        onClose={() => setResolving(null)}
        onSubmit={submitResolve}
        submitting={submitting}
        submitLabel="Mark resolved"
        error={modalError}
      >
        {resolving && (
          <div style={{ fontSize: 14, color: "#374151" }}>
            <strong>{resolving.type}</strong> ({resolving.severity})<br />
            {resolving.description}
          </div>
        )}
        <Labeled label="Resolution note *">
          <textarea
            style={{ ...inputStyle, minHeight: 80 }}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="What was done to resolve this?"
          />
        </Labeled>
      </FormModal>
    </div>
  );
}
