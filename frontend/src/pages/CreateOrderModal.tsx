import { useEffect, useState } from "react";
import {
  createDelivery,
  getHubs,
  getCustomers,
  type HubRef,
  type CustomerRef,
  type DeliveryCreatePayload,
} from "../services/api";

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void; // parent reloads the list
}

const SERVICE_TYPES = ["Express", "Standard", "Freight", "Same-day"];
const PRIORITIES = ["Low", "Normal", "High"];

const EMPTY_FORM = {
  customer_id: "",
  hub_id: "",
  pickup_address: "",
  delivery_address: "",
  city: "",
  zip_code: "",
  parcel_count: 1,
  weight_kg: "",
  service_type: "Standard",
  priority: "Normal",
  notes: "",
};

export default function CreateOrderModal({
  open,
  onClose,
  onCreated,
}: CreateOrderModalProps) {
  const [hubs, setHubs] = useState<HubRef[]>([]);
  const [customers, setCustomers] = useState<CustomerRef[]>([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Load hubs + customers when the modal opens
  useEffect(() => {
    if (!open) return;
    setLoadingRefs(true);
    setError(null);
    Promise.all([getHubs(), getCustomers()])
      .then(([h, c]) => {
        setHubs(h.items);
        setCustomers(c.items);
      })
      .catch((e: any) => setError(e.message || "Failed to load hubs/customers"))
      .finally(() => setLoadingRefs(false));
  }, [open]);

  // Reset the form each time it opens
  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM });
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  function update<K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.customer_id) return "Select a customer.";
    if (!form.hub_id) return "Select a hub.";
    if (!form.pickup_address.trim()) return "Pickup address is required.";
    if (!form.delivery_address.trim()) return "Delivery address is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.zip_code.trim()) return "Zip code is required.";
    if (!form.service_type) return "Service type is required.";
    if (form.parcel_count < 1) return "Parcel count must be at least 1.";
    return null;
  }

  async function handleSubmit() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);

    const payload: DeliveryCreatePayload = {
      customer_id: form.customer_id,
      hub_id: form.hub_id,
      pickup_address: form.pickup_address.trim(),
      delivery_address: form.delivery_address.trim(),
      city: form.city.trim(),
      zip_code: form.zip_code.trim(),
      parcel_count: form.parcel_count,
      weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
      service_type: form.service_type,
      priority: form.priority,
      notes: form.notes.trim() || null,
    };

    try {
      await createDelivery(payload);
      onCreated(); // parent reloads the table
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to create delivery");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 60,
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: 12,
          width: 560,
          maxWidth: "92vw",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>Create New Order</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#6b7280",
            }}
            aria-label="Close"
          >
            ×
          </button>
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

        {loadingRefs ? (
          <p>Loading hubs and customers…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Customer">
              <select
                value={form.customer_id}
                onChange={(e) => update("customer_id", e.target.value)}
                style={selectStyle}
              >
                <option value="" disabled>
                  Select a customer…
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Origin hub">
              <select
                value={form.hub_id}
                onChange={(e) => update("hub_id", e.target.value)}
                style={selectStyle}
              >
                <option value="" disabled>
                  Select a hub…
                </option>
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.code} — {h.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Pickup address">
              <input
                style={inputStyle}
                value={form.pickup_address}
                onChange={(e) => update("pickup_address", e.target.value)}
                placeholder="15 Rue du Commerce"
              />
            </Field>

            <Field label="Delivery address">
              <input
                style={inputStyle}
                value={form.delivery_address}
                onChange={(e) => update("delivery_address", e.target.value)}
                placeholder="89 Client Street"
              />
            </Field>

            <div style={{ display: "flex", gap: 12 }}>
              <Field label="City" style={{ flex: 2 }}>
                <input
                  style={inputStyle}
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Paris"
                />
              </Field>
              <Field label="Zip code" style={{ flex: 1 }}>
                <input
                  style={inputStyle}
                  value={form.zip_code}
                  onChange={(e) => update("zip_code", e.target.value)}
                  placeholder="75011"
                />
              </Field>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Parcels" style={{ flex: 1 }}>
                <input
                  type="number"
                  min={1}
                  style={inputStyle}
                  value={form.parcel_count}
                  onChange={(e) =>
                    update("parcel_count", Math.max(1, Number(e.target.value)))
                  }
                />
              </Field>
              <Field label="Weight (kg)" style={{ flex: 1 }}>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  style={inputStyle}
                  value={form.weight_kg}
                  onChange={(e) => update("weight_kg", e.target.value)}
                  placeholder="optional"
                />
              </Field>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Service type" style={{ flex: 1 }}>
                <select
                  value={form.service_type}
                  onChange={(e) => update("service_type", e.target.value)}
                  style={selectStyle}
                >
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority" style={{ flex: 1 }}>
                <select
                  value={form.priority}
                  onChange={(e) => update("priority", e.target.value)}
                  style={selectStyle}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Notes (optional)">
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Any special instructions…"
              />
            </Field>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 8,
              }}
            >
              <button
                onClick={onClose}
                disabled={submitting}
                style={secondaryBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={primaryBtn}
              >
                {submitting ? "Creating…" : "Create Order"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
};
const selectStyle: React.CSSProperties = { ...inputStyle };
const primaryBtn: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "9px 18px",
  fontWeight: 600,
  cursor: "pointer",
};
const secondaryBtn: React.CSSProperties = {
  background: "#e5e7eb",
  color: "#374151",
  border: "none",
  borderRadius: 6,
  padding: "9px 18px",
  fontWeight: 600,
  cursor: "pointer",
};
