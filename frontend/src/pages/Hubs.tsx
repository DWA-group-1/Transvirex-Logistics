import { useEffect, useState, useCallback } from "react";
import { getHubs, createHub, type HubRef } from "../services/api";
import FormModal from "../components/FormModal";
import { Labeled, inputStyle, newButton } from "../components/FormBits";

const EMPTY = {
  code: "",
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
        city: form.city.trim(),
        zip_code: form.zip_code.trim(),
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
          <button style={newButton} onClick={openModal}>
            <i className="bi bi-plus-lg me-1" />
            New Hub
          </button>
        </div>

        {/* Error */}
        {listError && <div className="lh-error">{listError}</div>}

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

                  <div className="lh-hub-card__footer">
                    <span>
                      <i className="bi bi-box-seam me-1" />
                      Capacity: {h.capacity ?? "—"}
                    </span>
                  </div>
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

        <Labeled label="City *">
          <input
            style={inputStyle}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Paris"
          />
        </Labeled>

        <Labeled label="Zip code *">
          <input
            style={inputStyle}
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
