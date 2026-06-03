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

const EMPTY = { name: "", contact_name: "", email: "", address: "" };

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
    if (!form.name.trim() || !form.address.trim()) {
      setFormError("Company name and address are required.");
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
    <div style={{ padding: 24 }}>
      <div style={pageHeaderRow}>
        <div>
          <h1 style={{ margin: 0 }}>Customers</h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0" }}>
            Manage customer accounts referenced by deliveries
            {!loading &&
              ` · ${customers.length} customer${customers.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button style={newButton} onClick={openModal}>
          + New Customer
        </button>
      </div>

      {listError && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {listError}
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
              <Th>Company</Th>
              <Th>Contact</Th>
              <Th>Email</Th>
              <Th>Address</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <Td>{c.name}</Td>
                <Td>{c.contact_name ?? "—"}</Td>
                <Td>{c.email ?? "—"}</Td>
                <Td>{c.address}</Td>
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
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="EcomExpress SAS"
          />
        </Labeled>
        <Labeled label="Contact name">
          <input
            style={inputStyle}
            value={form.contact_name}
            onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
            placeholder="John Smith"
          />
        </Labeled>
        <Labeled label="Email">
          <input
            style={inputStyle}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="contact@ecomexpress.fr"
          />
        </Labeled>
        <Labeled label="Address *">
          <input
            style={inputStyle}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="15 Commerce Street, Paris"
          />
        </Labeled>
      </FormModal>
    </div>
  );
}
