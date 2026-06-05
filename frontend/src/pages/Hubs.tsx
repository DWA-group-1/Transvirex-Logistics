import { useEffect, useState, useCallback } from "react";
import { getHubs, createHub, type HubRef } from "../services/api";
import FormModal from "../components/FormModal";
import {
  Labeled,
  inputStyle,
  Th,
  Td,
  pageHeaderRow,
  newButton,
} from "../components/FormBits";

const EMPTY = { code: "", name: "", address: "", capacity: "" };

export default function Hubs() {
  const [hubs, setHubs] = useState<HubRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setListError(null);

    try {
      const res = await getHubs();
      setHubs(res.items);
    } catch (e: any) {
      setListError(e.message || "Failed to load hubs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openModal() {
    setForm({ ...EMPTY });
    setFormError(null);
    setOpen(true);
  }

  async function handleSubmit() {
    if (!form.code.trim() || !form.name.trim() || !form.address.trim()) {
      setFormError("Code, name and address are required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createHub({
        code: form.code.trim(),
        name: form.name.trim(),
        address: form.address.trim(),
        capacity: form.capacity === "" ? null : Number(form.capacity),
      });

      setOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e.message || "Failed to create hub");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={pageHeaderRow}>
        <div>
          <h1 style={{ margin: 0, color: "var(--font-color)" }}>Hubs</h1>

          <p style={mutedText}>
            Manage depots and warehouses
            {!loading &&
              ` · ${hubs.length} hub${hubs.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <button style={newButton} onClick={openModal}>
          + New Hub
        </button>
      </div>

      {listError && <div style={errorBox}>{listError}</div>}

      {loading ? (
        <p style={mutedText}>Loading…</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderStyle}>
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Address</Th>
              <Th>Capacity</Th>
              <Th>Status</Th>
            </tr>
          </thead>

          <tbody>
            {hubs.map((h) => (
              <tr key={h.id} style={tableRowStyle}>
                <Td>{h.code}</Td>
                <Td>{h.name}</Td>
                <Td>{h.address}</Td>
                <Td>{h.capacity ?? "—"}</Td>
                <Td>{h.is_active ? "Active" : "Inactive"}</Td>
              </tr>
            ))}

            {hubs.length === 0 && (
              <tr>
                <Td colSpan={5}>No hubs yet. Create one to get started.</Td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <FormModal
        open={open}
        title="New hub"
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Create hub"
        error={formError}
      >
        <Labeled label="Code *">
          <input
            style={themedInput}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="PAR-01"
          />
        </Labeled>

        <Labeled label="Name *">
          <input
            style={themedInput}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Paris Nord Depot"
          />
        </Labeled>

        <Labeled label="Address *">
          <input
            style={themedInput}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="12 rue de la Logistique, 75018 Paris"
          />
        </Labeled>

        <Labeled label="Capacity">
          <input
            type="number"
            min={0}
            style={themedInput}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            placeholder="optional"
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

const themedInput: React.CSSProperties = {
  ...inputStyle,
  background: "var(--selected-color)",
  color: "var(--font-color)",
  border: "1px solid color-mix(in srgb, var(--font-color) 20%, transparent)",
};