import { useEffect, useState, useCallback } from "react";
import {
  getHubs,
  createHub,
  updateHub,
  deactivateHub,
  type HubRef,
} from "../services/api";
import FormModal from "../components/FormModal";
import { Labeled, inputStyle, newButton } from "../components/FormBits";

const EMPTY = {
  name: "",
  address: "",
  city: "",
  zip_code: "",
  capacity: "",
};

export default function Hubs() {
  const [hubs, setHubs] = useState<HubRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setListError(null);
    try {
      const res = await getHubs(showInactive);
      setHubs(res.items);
    } catch (e: any) {
      setListError(e.message || "Failed to load hubs");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setFormError(null);
    setOpen(true);
  }

  function openEdit(h: HubRef) {
    setEditingId(h.id);
    setForm({
      name: h.name,
      address: h.address,
      city: h.city ?? "",
      zip_code: h.zip_code ?? "",
      capacity: h.capacity?.toString() ?? "",
    });
    setFormError(null);
    setOpen(true);
  }

  async function handleSubmit() {
    if (
      !form.name.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.zip_code.trim()
    ) {
      setFormError("Code, name and the full address are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      zip_code: form.zip_code.trim(),
      capacity: form.capacity === "" ? null : Number(form.capacity),
    };
    try {
      if (editingId) {
        await updateHub(editingId, payload);
      } else {
        await createHub(payload);
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e.message || "Failed to save hub");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(h: HubRef) {
    setBusyId(h.id);
    try {
      if (h.is_active) {
        await deactivateHub(h.id);
      } else {
        await updateHub(h.id, { is_active: true });
      }
      await load();
    } catch (e: any) {
      setListError(e.message || "Failed to update hub");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <style>{`
        .lh-page { padding: 24px; color: var(--font-color); }

        .lh-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .lh-topbar h1 {
          font-size: 26px;
          font-weight: 700;
          margin: 0;
          color: var(--font-color);
        }

        .lh-topbar p {
          font-size: 14px;
          color: color-mix(in srgb, var(--font-color) 65%, transparent);
          margin: 4px 0 0;
        }

        .lh-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .lh-hub-card {
          background: color-mix(in srgb, var(--font-color) 4%, transparent);
          border: 1.5px solid color-mix(in srgb, var(--font-color) 12%, transparent);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: box-shadow 0.15s;
        }

        .lh-hub-card:hover {
          box-shadow: 0 4px 20px color-mix(in srgb, var(--font-color) 10%, transparent);
        }

        .lh-hub-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .lh-hub-card__name {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 2px;
          color: var(--font-color);
        }

        .lh-hub-card__meta {
          font-size: 12px;
          color: color-mix(in srgb, var(--font-color) 55%, transparent);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .lh-hub-card__badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .lh-hub-card__badge--active {
          background: color-mix(in srgb, #22c55e 15%, transparent);
          color: #22c55e;
          border: 1px solid color-mix(in srgb, #22c55e 30%, transparent);
        }

        .lh-hub-card__badge--inactive {
          background: color-mix(in srgb, var(--font-color) 8%, transparent);
          color: color-mix(in srgb, var(--font-color) 55%, transparent);
          border: 1px solid color-mix(in srgb, var(--font-color) 15%, transparent);
        }

        .lh-hub-card__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid color-mix(in srgb, var(--font-color) 10%, transparent);
          padding-top: 10px;
          font-size: 12px;
          color: color-mix(in srgb, var(--font-color) 50%, transparent);
        }

        .lh-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: color-mix(in srgb, var(--font-color) 45%, transparent);
        }

        .lh-empty i { font-size: 42px; display: block; margin-bottom: 12px; }
        .lh-empty p { font-size: 15px; margin: 0; }

        .lh-error {
          background: color-mix(in srgb, #ef4444 16%, var(--bg-color));
          color: #ef4444;
          border: 1px solid color-mix(in srgb, #ef4444 40%, transparent);
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 13px;
        }
      `}</style>

      <div className="lh-page">
        {/* Top bar */}
        <div className="lh-topbar">
          <div>
            <h1>
              <i
                className="bi bi-diagram-3 me-2"
                style={{ color: "var(--main-color)" }}
              />
              Hubs
            </h1>
            <p>
              Manage depots and warehouses
              {!loading &&
                ` · ${hubs.length} hub${hubs.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button style={newButton} onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />
            New Hub
          </button>
        </div>

        {/* Error */}
        {listError && <div className="lh-error">{listError}</div>}

        <label style={filterToggle}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>

        {/* Grid */}
        {loading ? (
          <p
            style={{
              color: "color-mix(in srgb, var(--font-color) 55%, transparent)",
            }}
          >
            Loading…
          </p>
        ) : (
          <div className="lh-grid">
            {hubs.length === 0 ? (
              <div className="lh-empty">
                <i className="bi bi-building" />
                <p>No hubs yet. Create one to get started.</p>
              </div>
            ) : (
              hubs.map((h) => (
                <div key={h.id} className="lh-hub-card">
                  <div className="lh-hub-card__header">
                    <div>
                      <div className="lh-hub-card__name">{h.name}</div>
                      <div className="lh-hub-card__meta">
                        <span>
                          <i className="bi bi-geo-alt me-1" />
                          {h.address}
                        </span>
                        <span>
                          <i className="bi bi-upc me-1" />
                          {h.code}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`lh-hub-card__badge ${h.is_active ? "lh-hub-card__badge--active" : "lh-hub-card__badge--inactive"}`}
                    >
                      <i
                        className={`bi ${h.is_active ? "bi-check-circle" : "bi-x-circle"}`}
                      />
                      {h.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div
                    className="lh-hub-card__footer"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Capacity: {h.capacity ?? "—"}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={linkBtn} onClick={() => openEdit(h)}>
                        Edit
                      </button>
                      <button
                        style={h.is_active ? dangerBtn : linkBtn}
                        disabled={busyId === h.id}
                        onClick={() => toggleActive(h)}
                      >
                        {busyId === h.id
                          ? "…"
                          : h.is_active
                            ? "Deactivate"
                            : "Reactivate"}
                      </button>
                    </div>
                  </div>{" "}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Hub Modal */}
      <FormModal
        open={open}
        title="New hub"
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Create hub"
        error={formError}
      >
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
            placeholder="12 Rue Logistique"
          />
        </Labeled>

        <Labeled label="City *">
          <input
            style={themedInput}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Paris"
          />
        </Labeled>

        <Labeled label="Zip code *">
          <input
            style={themedInput}
            value={form.zip_code}
            onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
            placeholder="75018"
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
    </>
  );
}

const themedInput: React.CSSProperties = {
  ...inputStyle,
  background: "var(--selected-color)",
  color: "var(--font-color)",
  border: "1px solid color-mix(in srgb, var(--font-color) 20%, transparent)",
};
const filterToggle: React.CSSProperties = {
  display: "inline-flex",
  gap: 6,
  alignItems: "center",
  margin: "8px 0 16px",
  color: "var(--font-color)",
  fontSize: 14,
  cursor: "pointer",
};
const linkBtn: React.CSSProperties = {
  background: "none",
  border: "1px solid color-mix(in srgb, var(--font-color) 25%, transparent)",
  color: "var(--font-color)",
  borderRadius: 6,
  padding: "4px 10px",
  fontSize: 13,
  cursor: "pointer",
};
const dangerBtn: React.CSSProperties = {
  ...linkBtn,
  color: "#ef4444",
  borderColor: "color-mix(in srgb, #ef4444 40%, transparent)",
};
