import { useState } from "react";
import { Container, Button, Table, Badge } from "react-bootstrap";

// SAMPLE DATA - Replace with API call later
const sampleInvoices = [
  {
    id: "INV-001",
    deliveryId: "DLV-2024-001",
    driverName: "John Smith",
    amount: 150.0,
    status: "Paid", // "Paid", "Pending", "Overdue"
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
  // STATE - Track which filter is selected
  const [filterStatus, setFilterStatus] = useState("All");

  // FILTER LOGIC - Show only invoices matching the selected status
  const filteredInvoices =
    filterStatus === "All"
      ? sampleInvoices
      : sampleInvoices.filter((inv) => inv.status === filterStatus);

  // HELPER - Return badge color based on payment status
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

  // HELPER - Export invoices as CSV (placeholder)
  const handleExport = () => {
    alert("Export feature coming soon!");
    // TODO: Implement CSV export logic
  };

  return (
    <Container fluid className="p-4">
      {/* PAGE HEADER */}
      <div className="mb-4">
        <h1>Invoice Tracking</h1>
        <p className="text-muted">Manage billed and unbilled deliveries</p>
      </div>

      {/* FILTER BUTTONS */}
      <div className="mb-4 d-flex gap-2">
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

      {/* EXPORT BUTTON */}
      <div className="mb-4">
        <Button variant="outline-secondary" onClick={handleExport}>
          <i className="bi bi-download me-2"></i>
          Export to CSV
        </Button>
      </div>

      {/* INVOICES TABLE */}
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead className="table-dark">
            <tr>
              <th>Invoice ID</th>
              <th>Delivery ID</th>
              <th>Driver</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Paid Date</th>
            </tr>
          </thead>
          <tbody>
            {/* IF NO INVOICES, SHOW EMPTY STATE */}
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  No invoices found
                </td>
              </tr>
            ) : (
              /* LOOP THROUGH INVOICES */
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="fw-bold">{invoice.id}</td>
                  <td>{invoice.deliveryId}</td>
                  <td>{invoice.driverName}</td>
                  <td>${invoice.amount.toFixed(2)}</td>
                  <td>{getStatusBadge(invoice.status)}</td>
                  <td>{invoice.dueDate}</td>
                  <td>{invoice.paidDate || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* SUMMARY STATS */}
      <div className="mt-4 row">
        <div className="col-md-3">
          <div className="p-3 border rounded">
            <p className="text-muted mb-1">Total Invoices</p>
            <h4>{sampleInvoices.length}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="p-3 border rounded">
            <p className="text-muted mb-1">Total Paid</p>
            <h4>
              $
              {sampleInvoices
                .filter((inv) => inv.status === "Paid")
                .reduce((sum, inv) => sum + inv.amount, 0)
                .toFixed(2)}
            </h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="p-3 border rounded">
            <p className="text-muted mb-1">Pending</p>
            <h4>
              $
              {sampleInvoices
                .filter((inv) => inv.status === "Pending")
                .reduce((sum, inv) => sum + inv.amount, 0)
                .toFixed(2)}
            </h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="p-3 border rounded">
            <p className="text-muted mb-1">Overdue</p>
            <h4>
              $
              {sampleInvoices
                .filter((inv) => inv.status === "Overdue")
                .reduce((sum, inv) => sum + inv.amount, 0)
                .toFixed(2)}
            </h4>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default TrackInvoices;
