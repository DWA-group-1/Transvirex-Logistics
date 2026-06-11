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
    <div style={pageStyle}>
      <div style={pageHeaderRow}>
        <div>
          <h1 style={{ margin: 0, color: "var(--font-color)" }}>Incidents</h1>

          <p style={mutedText}>Review and resolve reported incidents</p>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {(["open", "resolved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={filterButtonStyle(filter === f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {loading ? (
        <p style={mutedText}>Loading…</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderStyle}>
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
                <tr key={inc.id} style={tableRowStyle}>
                  <Td>{inc.type}</Td>

                  <Td>
                    <span style={badgeStyle(sev.bg, sev.color)}>
                      {inc.severity}
                    </span>
                  </Td>

                  <Td>{inc.description}</Td>

                  <Td>
                    {inc.delivery_address ?? "—"}
                    {inc.delivery_city ? `, ${inc.delivery_city}` : ""}

                    <div style={monoMutedText}>
                      {inc.delivery_id.slice(0, 8)}
                    </div>
                  </Td>

                  <Td>
                    {inc.status === "open" ? (
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>
                        Open
                      </span>
                    ) : (
                      <span style={{ color: "#22c55e", fontWeight: 700 }}>
                        Resolved
                      </span>
                    )}
                  </Td>

                  <Td>
                    {inc.status === "open" ? (
                      <button
                        onClick={() => openResolve(inc)}
                        style={resolveButton}
                      >
                        Resolve
                      </button>
                    ) : (
                      <span style={mutedSmallText}>{inc.resolution}</span>
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
          <div style={modalInfoBox}>
            <strong>{resolving.type}</strong> ({resolving.severity})
            <br />
            {resolving.description}
          </div>
        )}

        <Labeled label="Resolution note *">
          <textarea
            style={themedTextarea}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="What was done to resolve this?"
          />
        </Labeled>
      </FormModal>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  padding: 24,
  color: "var(--font-color)",
};

const mutedText: React.CSSProperties = {
  color: "color-mix(in srgb, var(--font-color) 65%, transparent)",
  margin: "4px 0 0",
};

const mutedSmallText: React.CSSProperties = {
  color: "color-mix(in srgb, var(--font-color) 65%, transparent)",
  fontSize: 13,
};

const monoMutedText: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: 11,
  color: "color-mix(in srgb, var(--font-color) 55%, transparent)",
};

const errorBox: React.CSSProperties = {
  background: "color-mix(in srgb, #ef4444 16%, var(--bg-color))",
  color: "#ef4444",
  border: "1px solid color-mix(in srgb, #ef4444 40%, transparent)",
  padding: "10px 14px",
  borderRadius: 8,
  marginBottom: 16,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  color: "var(--font-color)",
};

const tableHeaderStyle: React.CSSProperties = {
  background: "var(--selected-color)",
  color: "var(--font-color)",
  textAlign: "left",
};

const tableRowStyle: React.CSSProperties = {
  borderBottom:
    "1px solid color-mix(in srgb, var(--font-color) 12%, transparent)",
};

const resolveButton: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "6px 12px",
  fontWeight: 600,
  cursor: "pointer",
};

const modalInfoBox: React.CSSProperties = {
  fontSize: 14,
  color: "var(--font-color)",
  background: "var(--selected-color)",
  border: "1px solid color-mix(in srgb, var(--font-color) 16%, transparent)",
  borderRadius: 8,
  padding: 12,
  marginBottom: 12,
};

const themedTextarea: React.CSSProperties = {
  ...inputStyle,
  minHeight: 80,
  background: "var(--selected-color)",
  color: "var(--font-color)",
  border: "1px solid color-mix(in srgb, var(--font-color) 20%, transparent)",
};

function filterButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 14px",
    borderRadius: 6,
    border: active
      ? "1px solid #2563eb"
      : "1px solid color-mix(in srgb, var(--font-color) 18%, transparent)",
    background: active ? "#2563eb" : "var(--selected-color)",
    color: active ? "white" : "var(--font-color)",
    cursor: "pointer",
    fontWeight: 600,
    textTransform: "capitalize",
  };
}

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    color,
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  };
}

