import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Container,
  Spinner,
  Table,
} from "react-bootstrap";
import { getAuthToken } from "../services/api";

type InvoiceStatus = "pending" | "paid";

type InvoiceLine = {
  id: string;
  delivery_id: string;
  amount: string;
  description: string;
};

type Invoice = {
  id: string;
  number: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  period_start: string;
  period_end: string;
  total_amount: string;
  delivery_count: number;
  status: InvoiceStatus;
  payment_date: string | null;
  lines: InvoiceLine[];
};

function TrackInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        throw new Error("No access token found. Please log in again.");
      }

      const response = await fetch("http://localhost:8000/billing/invoices/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to load invoices: ${response.status} ${body}`);
      }

      const data: Invoice[] = await response.json();
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoices = async () => {
    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const token = getAuthToken();

      if (!token) {
        throw new Error("No access token found. Please log in again.");
      }

      const year = new Date().getFullYear();

      const response = await fetch(
        "http://localhost:8000/billing/invoices/generate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            period_start: `${year}-01-01T00:00:00Z`,
            period_end: `${year}-12-31T23:59:59Z`,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Failed to generate invoices: ${response.status} ${body}`,
        );
      }

      const result = await response.json();

      setSuccess(`Generated ${result.invoices_created} invoice(s).`);

      await fetchInvoices();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate invoices",
      );
    } finally {
      setGenerating(false);
    }
  };

  const markPaid = async (invoiceId: string) => {
    try {
      setPayingInvoiceId(invoiceId);
      setError("");
      setSuccess("");

      const token = getAuthToken();

      if (!token) {
        throw new Error("No access token found. Please log in again.");
      }

      const response = await fetch(
        `http://localhost:8000/billing/invoices/${invoiceId}/pay`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_date: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Failed to mark invoice as paid: ${response.status} ${body}`,
        );
      }

      setSuccess("Invoice marked as paid.");

      await fetchInvoices();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark invoice as paid",
      );
    } finally {
      setPayingInvoiceId(null);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const displayStatus = (invoice: Invoice) => {
    if (invoice.status === "paid") return "Paid";

    if (new Date(invoice.due_date) < new Date()) {
      return "Overdue";
    }

    return "Pending";
  };

  const filteredInvoices = useMemo(() => {
    if (filterStatus === "All") return invoices;
    return invoices.filter(
      (invoice) => displayStatus(invoice) === filterStatus,
    );
  }, [invoices, filterStatus]);

  const totalPaid = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);

  const pending = invoices
    .filter((invoice) => displayStatus(invoice) === "Pending")
    .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);

  const overdue = invoices
    .filter((invoice) => displayStatus(invoice) === "Overdue")
    .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge bg="success">{status}</Badge>;
      case "Pending":
        return <Badge bg="warning">{status}</Badge>;
      case "Overdue":
        return <Badge bg="danger">{status}</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const handleExport = () => {
    const rows = filteredInvoices.map((invoice) => ({
      invoice_number: invoice.number,
      customer_id: invoice.customer_id,
      deliveries: invoice.delivery_count,
      amount: Number(invoice.total_amount).toFixed(2),
      status: displayStatus(invoice),
      due_date: formatDate(invoice.due_date),
      paid_date: formatDate(invoice.payment_date),
    }));

    const headers = [
      "Invoice Number",
      "Customer ID",
      "Deliveries",
      "Amount",
      "Status",
      "Due Date",
      "Paid Date",
    ];

    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.invoice_number,
          row.customer_id,
          row.deliveries,
          row.amount,
          row.status,
          row.due_date,
          row.paid_date,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `transvirex-invoices-${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <Container fluid className="p-4" style={{ color: "var(--font-color)" }}>
      <div className="mb-4">
        <h1>Invoice Tracking</h1>
        <p style={mutedText}>Manage billed and unbilled deliveries</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="mb-4 d-flex gap-2 flex-wrap">
        {["All", "Paid", "Pending", "Overdue"].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? "primary" : "outline-primary"}
            onClick={() => setFilterStatus(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      <div className="mb-4 d-flex gap-2 flex-wrap">
        <Button
          variant="success"
          onClick={handleGenerateInvoices}
          disabled={generating}
        >
          {generating ? "Generating…" : "Generate Invoices"}
        </Button>

        <Button variant="outline-secondary" onClick={handleExport}>
          <i className="bi bi-download me-2" />
          Export to CSV
        </Button>

        <Button variant="outline-primary" onClick={fetchInvoices}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="p-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <div className="table-responsive">
          <Table bordered hover style={tableStyle}>
            <thead>
              <tr style={tableHeaderStyle}>
                <th style={th}>Invoice Number</th>
                <th style={th}>Customer ID</th>
                <th style={th}>Deliveries</th>
                <th style={th}>Amount</th>
                <th style={th}>Status</th>
                <th style={th}>Due Date</th>
                <th style={th}>Paid Date</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} style={emptyCellStyle}>
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const status = displayStatus(invoice);

                  return (
                    <tr key={invoice.id} style={tableRowStyle}>
                      <td style={{ ...td, fontWeight: 700 }}>
                        {invoice.number}
                      </td>
                      <td style={td}>{invoice.customer_id}</td>
                      <td style={td}>{invoice.delivery_count}</td>
                      <td style={td}>
                        €{Number(invoice.total_amount).toFixed(2)}
                      </td>
                      <td style={td}>{getStatusBadge(status)}</td>
                      <td style={td}>{formatDate(invoice.due_date)}</td>
                      <td style={td}>{formatDate(invoice.payment_date)}</td>
                      <td style={td}>
                        {invoice.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="success"
                            disabled={payingInvoiceId === invoice.id}
                            onClick={() => markPaid(invoice.id)}
                          >
                            {payingInvoiceId === invoice.id
                              ? "Updating…"
                              : "Mark Paid"}
                          </Button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      )}

      <div className="mt-4 row g-4">
        <SummaryCard label="Total Invoices" value={invoices.length} />
        <SummaryCard label="Total Paid" value={`€${totalPaid.toFixed(2)}`} />
        <SummaryCard label="Pending" value={`€${pending.toFixed(2)}`} />
        <SummaryCard label="Overdue" value={`€${overdue.toFixed(2)}`} />
      </div>
    </Container>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="col-md-3">
      <div style={summaryCardStyle}>
        <p style={mutedText}>{label}</p>
        <h4 style={{ margin: 0, color: "var(--font-color)" }}>{value}</h4>
      </div>
    </div>
  );
}

const mutedText: React.CSSProperties = {
  color: "color-mix(in srgb, var(--font-color) 65%, transparent)",
};

const tableStyle: React.CSSProperties = {
  color: "var(--font-color)",
  borderColor: "color-mix(in srgb, var(--font-color) 18%, transparent)",
};

const tableHeaderStyle: React.CSSProperties = {
  background: "var(--selected-color)",
  color: "var(--font-color)",
};

const tableRowStyle: React.CSSProperties = {
  background: "color-mix(in srgb, var(--font-color) 4%, transparent)",
  color: "var(--font-color)",
};

const th: React.CSSProperties = {
  padding: "12px",
};

const td: React.CSSProperties = {
  padding: "12px",
  color: "var(--font-color)",
  background: "transparent",
};

const emptyCellStyle: React.CSSProperties = {
  ...td,
  textAlign: "center",
  color: "color-mix(in srgb, var(--font-color) 65%, transparent)",
  padding: 24,
};

const summaryCardStyle: React.CSSProperties = {
  padding: 20,
  border: "1px solid color-mix(in srgb, var(--font-color) 16%, transparent)",
  borderRadius: 8,
  background: "var(--selected-color)",
  color: "var(--font-color)",
};

export default TrackInvoices;
