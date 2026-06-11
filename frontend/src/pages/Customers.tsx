import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
  type CustomerRef,
} from "../services/api";
import FormModal from "../components/FormModal";
import {
  Labeled,
  inputStyle,
  Th,
  Td,
  pageHeaderRow,
  newButton,
  SortableTh,
} from "../components/FormBits";
import { useSort } from "../hooks/useSort";

const EMPTY = {
  name: "",
  contact_name: "",
  email: "",
  address: "",
  city: "",
  zip_code: "",
};

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerRef[]>([]);
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
      const res = await getCustomers(showInactive);
      setCustomers(res.items);
    } catch (e: any) {
      setListError(e.message || "Failed to load customers");
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

  function openEdit(c: CustomerRef) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      contact_name: c.contact_name ?? "",
      email: c.email ?? "",
      address: c.address,
      city: c.city ?? "",
      zip_code: c.zip_code ?? "",
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
      setFormError("Company name and full address are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      contact_name: form.contact_name.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim(),
      city: form.city.trim(),
      zip_code: form.zip_code.trim(),
    };

    try {
      if (editingId) {
        await updateCustomer(editingId, payload);
      } else {
        await createCustomer(payload);
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e.message || "Failed to save customer");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(c: CustomerRef) {
    setBusyId(c.id);
    try {
      if (c.is_active) {
        await deactivateCustomer(c.id);
      } else {
        await updateCustomer(c.id, { is_active: true });
      }
      await load();
    } catch (e: any) {
      setListError(e.message || "Failed to update customer");
    } finally {
      setBusyId(null);
    }
  }

  const sortAccessors = useMemo(
    () => ({
      reference: (c: CustomerRef) => c.reference,
      name: (c: CustomerRef) => c.name,
      contact: (c: CustomerRef) => c.contact_name,
      email: (c: CustomerRef) => c.email,
      address: (c: CustomerRef) => c.address,
      city: (c: CustomerRef) => c.city,
      status: (c: CustomerRef) => c.is_active,
    }),
    [],
  );
  const { sorted, sortKey, sortDir, toggle } = useSort(
    customers,
    sortAccessors,
    { key: "name" },
  );

  return (
    <div style={pageStyle}>
      <div style={pageHeaderRow}>
        <div>
          <h1 style={{ margin: 0, color: "var(--font-color)" }}>Customers</h1>
          <p style={mutedText}>
            Manage customer accounts referenced by deliveries
            {!loading &&
              ` · ${customers.length} customer${customers.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button style={newButton} onClick={openCreate}>
          + New Customer
        </button>
      </div>

      <label style={filterToggle}>
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
        />
        Show inactive
      </label>

      {listError && <div style={errorBox}>{listError}</div>}

      {loading ? (
        <p style={mutedText}>Loading…</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderStyle}>
                <SortableTh
                  label="Reference"
                  col="reference"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <SortableTh
                  label="Company"
                  col="name"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <SortableTh
                  label="Contact"
                  col="contact"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <SortableTh
                  label="Email"
                  col="email"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <SortableTh
                  label="Address"
                  col="address"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <SortableTh
                  label="City"
                  col="city"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <SortableTh
                  label="Status"
                  col="status"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggle}
                />
                <Th>Actions</Th> {/* not sortable */}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr
                  key={c.id}
                  style={{ ...tableRowStyle, opacity: c.is_active ? 1 : 0.55 }}
                >
                  <Td>{c.reference ?? "—"}</Td>
                  <Td>{c.name}</Td>
                  <Td>{c.contact_name ?? "—"}</Td>
                  <Td>{c.email ?? "—"}</Td>
                  <Td>{c.address}</Td>
                  <Td>{c.city ?? "—"}</Td>
                  <Td>{c.is_active ? "Active" : "Inactive"}</Td>
                  <Td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={linkBtn} onClick={() => openEdit(c)}>
                        Edit
                      </button>
                      <button
                        style={c.is_active ? dangerBtn : linkBtn}
                        disabled={busyId === c.id}
                        onClick={() => toggleActive(c)}
                      >
                        {busyId === c.id
                          ? "…"
                          : c.is_active
                            ? "Deactivate"
                            : "Reactivate"}
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <Td colSpan={8}>
                    No customers yet. Create one to get started.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <FormModal
        open={open}
        title={editingId ? "Edit customer" : "New customer"}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editingId ? "Save changes" : "Create customer"}
        error={formError}
      >
        <Labeled label="Company name *">
          <input
            style={themedInput}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="EcomExpress SAS"
          />
        </Labeled>
        <Labeled label="Contact name">
          <input
            style={themedInput}
            value={form.contact_name}
            onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
            placeholder="John Smith"
          />
        </Labeled>
        <Labeled label="Email">
          <input
            style={themedInput}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="contact@ecomexpress.fr"
          />
        </Labeled>
        <Labeled label="Address *">
          <input
            style={themedInput}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="15 Commerce Street"
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
            placeholder="75001"
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
const filterToggle: React.CSSProperties = {
  display: "inline-flex",
  gap: 6,
  alignItems: "center",
  margin: "8px 0 16px",
  color: "var(--font-color)",
  fontSize: 14,
  cursor: "pointer",
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
  minWidth: 820,
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
