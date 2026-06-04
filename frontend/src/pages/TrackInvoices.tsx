import { useState } from "react";
import { Badge, Button, Container, Table } from "react-bootstrap";

const sampleInvoices = [
  {
    id: "INV-001",
    deliveryId: "DLV-2024-001",
    driverName: "John Smith",
    amount: 150.0,
    status: "Paid",
    dueDate: "2024-05-20",
    paidDate: "2024-05-18",
  },
  {
    id: "INV-002",
    deliveryId: "DLV-2024-002",
    driverName: "Jane Doe",
    amount: 200.0,
    status: "Pending",
    dueDate: "2024-05-25",
    paidDate: null,
  },
  {
    id: "INV-003",
    deliveryId: "DLV-2024-003",
    driverName: "Mike Johnson",
    amount: 175.5,
    status: "Overdue",
    dueDate: "2024-05-10",
    paidDate: null,
  },
];

function TrackInvoices() {
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredInvoices =
    filterStatus === "All"
      ? sampleInvoices
      : sampleInvoices.filter((inv) => inv.status === filterStatus);

  const totalPaid = sampleInvoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pending = sampleInvoices
    .filter((inv) => inv.status === "Pending")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdue = sampleInvoices
    .filter((inv) => inv.status === "Overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);

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

  const handleExport = () => {
    alert("Export feature coming soon!");
  };

  return (
    <Container fluid className="p-4" style={{ color: "var(--font-color)" }}>
      <div className="mb-4">
        <h1>Invoice Tracking</h1>
        <p style={mutedText}>Manage billed and unbilled deliveries</p>
      </div>

      <div className="mb-4 d-flex gap-2 flex-wrap">
        <Button
          variant={filterStatus === "All" ? "primary" : "outline-primary"}
          onClick={() => setFilterStatus("All")}
        >
          All
        </Button>

        <Button
          variant={filterStatus === "Paid" ? "success" : "outline-success"}
          onClick={() => setFilterStatus("Paid")}
        >
          Paid
        </Button>

        <Button
          variant={filterStatus === "Pending" ? "warning" : "outline-warning"}
          onClick={() => setFilterStatus("Pending")}
        >
          Pending
        </Button>

        <Button
          variant={filterStatus === "Overdue" ? "danger" : "outline-danger"}
          onClick={() => setFilterStatus("Overdue")}
        >
          Overdue
        </Button>
      </div>

      <div className="mb-4">
        <Button variant="outline-secondary" onClick={handleExport}>
          <i className="bi bi-download me-2" />
          Export to CSV
        </Button>
      </div>

      <div className="table-responsive">
        <Table bordered hover style={tableStyle}>
          <thead>
            <tr style={tableHeaderStyle}>
              <th style={th}>Invoice ID</th>
              <th style={th}>Delivery ID</th>
              <th style={th}>Driver</th>
              <th style={th}>Amount</th>
              <th style={th}>Status</th>
              <th style={th}>Due Date</th>
              <th style={th}>Paid Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} style={emptyCellStyle}>
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} style={tableRowStyle}>
                  <td style={{ ...td, fontWeight: 700 }}>{invoice.id}</td>
                  <td style={td}>{invoice.deliveryId}</td>
                  <td style={td}>{invoice.driverName}</td>
                  <td style={td}>${invoice.amount.toFixed(2)}</td>
                  <td style={td}>{getStatusBadge(invoice.status)}</td>
                  <td style={td}>{invoice.dueDate}</td>
                  <td style={td}>{invoice.paidDate || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <div className="mt-4 row g-4">
        <SummaryCard label="Total Invoices" value={sampleInvoices.length} />
        <SummaryCard label="Total Paid" value={`$${totalPaid.toFixed(2)}`} />
        <SummaryCard label="Pending" value={`$${pending.toFixed(2)}`} />
        <SummaryCard label="Overdue" value={`$${overdue.toFixed(2)}`} />
      </div>
    </Container>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
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