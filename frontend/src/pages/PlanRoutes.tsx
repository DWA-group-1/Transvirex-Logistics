import { useState } from "react";
import { Container, Button, Card, Badge, Modal, Form } from "react-bootstrap";

// SAMPLE DATA - Replace with API call later
const sampleAssignments = [
  {
    id: "ASS-001",
    deliveryId: "DLV-2024-101",
    route: "Downtown Area - Route A",
    pickupLocation: "Hub Main, 123 Main St",
    deliveryLocation: "Customer 1, 456 Oak Ave",
    status: "Pending", // "Pending", "Accepted", "Completed", "Declined"
    priority: "High",
    deliveryTime: "10:00 AM - 12:00 PM",
    items: 5,
  },
  {
    id: "ASS-002",
    deliveryId: "DLV-2024-102",
    route: "Downtown Area - Route A",
    pickupLocation: "Hub Main, 123 Main St",
    deliveryLocation: "Customer 2, 789 Elm St",
    status: "Pending",
    priority: "Medium",
    deliveryTime: "12:30 PM - 1:30 PM",
    items: 3,
  },
  {
    id: "ASS-003",
    deliveryId: "DLV-2024-103",
    route: "Suburbs - Route B",
    pickupLocation: "Hub Secondary, 999 Park Blvd",
    deliveryLocation: "Customer 3, 321 Pine Rd",
    status: "Pending",
    priority: "Low",
    deliveryTime: "2:00 PM - 3:00 PM",
    items: 2,
  },
];

// SAMPLE HISTORY - Completed assignments
const sampleHistory = [
  {
    id: "ASS-001-HIST",
    deliveryId: "DLV-2024-050",
    route: "Downtown Area - Route A",
    deliveryLocation: "Customer X, Address X",
    status: "Completed",
    completedDate: "2024-05-17",
  },
  {
    id: "ASS-002-HIST",
    deliveryId: "DLV-2024-051",
    route: "Suburbs - Route B",
    deliveryLocation: "Customer Y, Address Y",
    status: "Completed",
    completedDate: "2024-05-16",
  },
];

function PlanRoutes() {
  // STATE - Track selected assignment for details modal
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // STATE - Track incident/delivery report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("Delivered"); // "Delivered", "Incident"
  const [reportMessage, setReportMessage] = useState("");

  // HELPER - Get priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge bg="danger">{priority}</Badge>;
      case "Medium":
        return <Badge bg="warning">{priority}</Badge>;
      case "Low":
        return <Badge bg="info">{priority}</Badge>;
      default:
        return <Badge bg="secondary">{priority}</Badge>;
    }
  };

  // HELPER - Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Accepted":
        return <Badge bg="success">{status}</Badge>;
      case "Completed":
        return <Badge bg="success">{status}</Badge>;
      case "Pending":
        return <Badge bg="warning">{status}</Badge>;
      case "Declined":
        return <Badge bg="danger">{status}</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // HANDLER - Accept assignment
  const handleAccept = (assignment: any) => {
    alert(`Assignment ${assignment.id} accepted!`);
    // TODO: Update API to mark assignment as accepted
  };

  // HANDLER - Decline assignment
  const handleDecline = (assignment: any) => {
    alert(`Assignment ${assignment.id} declined!`);
    // TODO: Update API to mark assignment as declined
  };

  // HANDLER - Open details modal
  const handleViewDetails = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  // HANDLER - Submit report (delivery or incident)
  const handleSubmitReport = () => {
    alert(`Report submitted: ${reportType} - ${reportMessage}`);
    setReportMessage("");
    setReportType("Delivered");
    setShowReportModal(false);
    // TODO: Send report to API
  };

  return (
    <Container fluid className="p-4">
      {/* PAGE HEADER */}
      <div className="mb-4">
        <h1>My Daily Route & Assignments</h1>
        <p className="text-muted">
          View, accept, or decline today's deliveries
        </p>
      </div>

      {/* TODAY'S ASSIGNMENTS SECTION */}
      <div className="mb-5">
        <h3 className="mb-3">Pending Assignments</h3>

        {/* ASSIGNMENTS GRID */}
        <div className="row">
          {sampleAssignments.map((assignment) => (
            <div key={assignment.id} className="col-md-6 mb-3">
              <Card className="h-100">
                <Card.Body>
                  {/* HEADER WITH ID AND PRIORITY */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5>{assignment.deliveryId}</h5>
                    {getPriorityBadge(assignment.priority)}
                  </div>

                  {/* ROUTE INFO */}
                  <p className="text-muted mb-2">
                    <i className="bi bi-geo-alt me-2"></i>
                    {assignment.route}
                  </p>

                  {/* DELIVERY LOCATION */}
                  <p className="mb-2">
                    <strong>Deliver to:</strong>
                    <br />
                    {assignment.deliveryLocation}
                  </p>

                  {/* TIME WINDOW */}
                  <p className="text-muted mb-2">
                    <i className="bi bi-clock me-2"></i>
                    {assignment.deliveryTime}
                  </p>

                  {/* ITEMS COUNT */}
                  <p className="mb-3">
                    <badge className="bg-light text-dark">
                      {assignment.items} item(s)
                    </badge>
                  </p>

                  {/* ACTION BUTTONS */}
                  <div className="d-flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAccept(assignment)}
                      className="flex-grow-1"
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDecline(assignment)}
                      className="flex-grow-1"
                    >
                      Decline
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleViewDetails(assignment)}
                    >
                      Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* REPORT BUTTON */}
      <div className="mb-5">
        <Button
          variant="outline-primary"
          onClick={() => setShowReportModal(true)}
        >
          <i className="bi bi-exclamation-triangle me-2"></i>
          Report Delivery / Incident
        </Button>
      </div>

      {/* ASSIGNMENT HISTORY SECTION */}
      <div className="mb-5">
        <h3 className="mb-3">Completed Assignments</h3>

        {/* HISTORY TABLE */}
        <div className="table-responsive">
          <table className="table table-sm table-striped">
            <thead className="table-light">
              <tr>
                <th>Delivery ID</th>
                <th>Route</th>
                <th>Location</th>
                <th>Date Completed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sampleHistory.map((hist) => (
                <tr key={hist.id}>
                  <td className="fw-bold">{hist.deliveryId}</td>
                  <td>{hist.route}</td>
                  <td>{hist.deliveryLocation}</td>
                  <td>{hist.completedDate}</td>
                  <td>{getStatusBadge(hist.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILS MODAL */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assignment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssignment && (
            <>
              <p>
                <strong>Delivery ID:</strong> {selectedAssignment.deliveryId}
              </p>
              <p>
                <strong>Route:</strong> {selectedAssignment.route}
              </p>
              <p>
                <strong>Pickup:</strong> {selectedAssignment.pickupLocation}
              </p>
              <p>
                <strong>Delivery Location:</strong>{" "}
                {selectedAssignment.deliveryLocation}
              </p>
              <p>
                <strong>Time Window:</strong> {selectedAssignment.deliveryTime}
              </p>
              <p>
                <strong>Items:</strong> {selectedAssignment.items}
              </p>
              <p>
                <strong>Priority:</strong>{" "}
                {getPriorityBadge(selectedAssignment.priority)}
              </p>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* REPORT MODAL */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Report Delivery or Incident</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Report Type</Form.Label>
            <Form.Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option>Delivered</option>
              <option>Incident</option>
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Details</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Describe the delivery or incident..."
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmitReport}>
            Submit Report
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default PlanRoutes;
