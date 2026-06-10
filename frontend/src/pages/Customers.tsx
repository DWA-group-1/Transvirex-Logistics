import { useEffect, useState, useCallback } from "react";
import {
  getCustomers,
  createCustomer,
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
} from "../components/FormBits";

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

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setListError(null);

    try {
      const res = await getCustomers();
      setCustomers(res.items);
    } catch (e: any) {
      setListError(e.message || "Failed to load customers");
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

    try {
      await createCustomer({
        name: form.name.trim(),
        contact_name: form.contact_name.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim(),
        city: form.city.trim(),
        zip_code: form.zip_code.trim(),
      });

      setOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e.message || "Failed to create customer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={pageHeaderRow}>
        <div>
          <h1 style={{ margin: 0, color: "var(--font-color)" }}>Customers</h1>

          <p style={mutedText}>
            Manage customer accounts referenced by deliveries
            {!loading &&
              ` · ${customers.length} customer${
                customers.length === 1 ? "" : "s"
              }`}
          </p>
        </div>

        <button style={newButton} onClick={openModal}>
          + New Customer
        </button>
      </div>

      {listError && <div style={errorBox}>{listError}</div>}

      {loading ? (
        <p style={mutedText}>Loading…</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderStyle}>
              <Th>Reference</Th>
              <Th>Company</Th>
              <Th>Contact</Th>
              <Th>Email</Th>
              <Th>Address</Th>
              <Th>City</Th>
              <Th>Status</Th>
            </tr>
          </thead>

          <tbody>
            {customers.map((c) => (
              <tr key={c.id} style={tableRowStyle}>
                <Td>{c.reference}</Td>
                <Td>{c.name}</Td>
                <Td>{c.contact_name ?? "—"}</Td>
                <Td>{c.email ?? "—"}</Td>
                <Td>{c.address}</Td>
                <Td>{c.city}</Td>
                <Td>{c.is_active ? "Active" : "Inactive"}</Td>
              </tr>
            ))}

            {customers.length === 0 && (
              <tr>
                <Td colSpan={5}>
                  No customers yet. Create one to get started.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <FormModal
        open={open}
        title="New customer"
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Create customer"
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

