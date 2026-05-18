import { useState } from "react";
import { Container, Button, Table, Badge, Modal, Form } from "react-bootstrap";

// SAMPLE DATA - Active drivers and their assignments
const sampleDrivers = [
  {
    id: "DRV-001",
    name: "John Smith",
    status: "In Transit", // "On Duty", "In Transit", "Break", "Off Duty"
    assignedDeliveries: 5,
    completedDeliveries: 12,
    location: "Downtown Hub",
    nextStop: "Customer A, 123 Main St",
  },
  {
    id: "DRV-002",
    name: "Jane Doe",
    status: "In Transit",
    assignedDeliveries: 3,
    completedDeliveries: 15,
    location: "Suburbs Area",
    nextStop: "Customer B, 456 Oak Ave",
  },
  {
    id: "DRV-003",
    name: "Mike Johnson",
    status: "On Duty",
    assignedDeliveries: 0,
    completedDeliveries: 10,
    location: "Main Hub",
    nextStop: "Awaiting assignment",
  },
];

// SAMPLE DATA - Active orders/deliveries
const sampleOrders = [
  {
    id: "ORD-001",
    deliveryId: "DLV-2024-201",
    customer: "Customer A",
    address: "123 Main St",
    status: "In Transit", // "Pending", "Assigned", "In Transit", "Delivered", "Delayed"
    driver: "John Smith",
    priority: "High",
    estimatedTime: "10:30 AM",
    alert: null,
  },
  {
    id: "ORD-002",
    deliveryId: "DLV-2024-202",
    customer: "Customer B",
    address: "456 Oak Ave",
    status: "In Transit",
    driver: "Jane Doe",
    priority: "Medium",
    estimatedTime: "11:00 AM",
    alert: null,
  },
  {
    id: "ORD-003",
    deliveryId: "DLV-2024-203",
    customer: "Customer C",
    address: "789 Elm St",
    status: "Delayed",
    driver: "John Smith",
    priority: "High",
    estimatedTime: "09:30 AM",
    alert: "Running 20 minutes late",
  },
  {
    id: "ORD-004",
    deliveryId: "DLV-2024-204",
    customer: "Customer D",
    address: "321 Pine Rd",
    status: "Pending",
    driver: null,
    priority: "Low",
    estimatedTime: "2:00 PM",
    alert: null,
  },
];

function TrackOrders() {
  // STATE - Track assignment modal visibility
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState("");

  // STATE - Track create order modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer: "",
    address: "",
    priority: "Medium",
  });

  // HELPER - Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return <Badge bg="success">{status}</Badge>;
      case "In Transit":
        return <Badge bg="info">{status}</Badge>;
      case "Assigned":
        return <Badge bg="primary">{status}</Badge>;
      case "Pending":
        return <Badge bg="warning">{status}</Badge>;
      case "Delayed":
        return <Badge bg="danger">{status}</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // HELPER - Get driver status badge color
  const getDriverStatusBadge = (status: string) => {
    switch (status) {
      case "In Transit":
        return <Badge bg="success">{status}</Badge>;
      case "On Duty":
        return <Badge bg="info">{status}</Badge>;
      case "Break":
        return <Badge bg="warning">{status}</Badge>;
      case "Off Duty":
        return <Badge bg="secondary">{status}</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // HELPER - Get priority badge
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

  // HANDLER - Open assignment modal
  const handleAssignClick = (order: any) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  // HANDLER - Submit assignment
  const handleSubmitAssignment = () => {
    alert(`Order ${selectedOrder.id} assigned to ${selectedDriver}`);
    setShowAssignModal(false);
    setSelectedDriver("");
    // TODO: Update API to assign order to driver
  };

  // HANDLER - Create new order
  const handleCreateOrder = () => {
    alert(`New order created for ${newOrder.customer}`);
    setNewOrder({ customer: "", address: "", priority: "Medium" });
    setShowCreateModal(false);
    // TODO: Send order to API
  };

  // CALCULATE - Total workload
  const totalDeliveries = sampleOrders.length;
  const completedDeliveries = sampleOrders.filter(
    (o) => o.status === "Delivered",
  ).length;
  const delayedDeliveries = sampleOrders.filter(
    (o) => o.status === "Delayed",
  ).length;

  return (
    <Container fluid className="p-4">
      {/* PAGE HEADER */}
      <div className="mb-4">
        <h1>Dispatcher Dashboard - Order Tracking</h1>
        <p className="text-muted">
          Create assignments and track real-time delivery status
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mb-4 d-flex gap-2">
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-plus-lg me-2"></i>
          Create New Order
        </Button>
      </div>

      {/* WORKLOAD SUMMARY */}
      <div className="mb-5 row">
        <div className="col-md-3">
          <div className="p-3 border rounded">
            <p className="text-muted mb-1">Total Orders</p>
            <h4>{totalDeliveries}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="p-3 border rounded">
            <p className="text-muted mb-1">Completed</p>
            <h4>{completedDeliveries}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="p-3 border rounded">
            <p className="text-muted mb-1">In Transit</p>
            <h4>
              {sampleOrders.filter((o) => o.status === "In Transit").length}
            </h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="p-3 border rounded bg-danger text-white">
            <p className="mb-1">Delayed Alerts</p>
            <h4>{delayedDeliveries}</h4>
          </div>
        </div>
      </div>

      {/* ACTIVE DRIVERS SECTION */}
      <div className="mb-5">
        <h3 className="mb-3">Active Drivers</h3>

        {/* DRIVERS TABLE */}
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="table-dark">
              <tr>
                <th>Driver Name</th>
                <th>Status</th>
                <th>Assigned Deliveries</th>
                <th>Completed Today</th>
                <th>Current Location</th>
                <th>Next Stop</th>
              </tr>
            </thead>
            <tbody>
              {sampleDrivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="fw-bold">{driver.name}</td>
                  <td>{getDriverStatusBadge(driver.status)}</td>
                  <td>{driver.assignedDeliveries}</td>
                  <td>{driver.completedDeliveries}</td>
                  <td>{driver.location}</td>
                  <td>{driver.nextStop}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* ACTIVE ORDERS / DELIVERIES SECTION */}
      <div className="mb-5">
        <h3 className="mb-3">Active Orders</h3>

        {/* ORDERS TABLE */}
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="table-dark">
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Driver</th>
                <th>Est. Time</th>
                <th>Alert</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sampleOrders.map((order) => (
                <tr
                  key={order.id}
                  className={order.alert ? "table-danger" : ""}
                >
                  <td className="fw-bold">{order.deliveryId}</td>
                  <td>{order.customer}</td>
                  <td>{order.address}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>{getPriorityBadge(order.priority)}</td>
                  <td>{order.driver || "-"}</td>
                  <td>{order.estimatedTime}</td>
                  <td>
                    {order.alert ? (
                      <Badge bg="danger">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        {order.alert}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {order.status === "Pending" && (
                      <Button
                        variant="sm"
                        size="sm"
                        onClick={() => handleAssignClick(order)}
                      >
                        Assign
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* ASSIGNMENT MODAL */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Order to Driver</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <p>
                <strong>Order:</strong> {selectedOrder.deliveryId}
              </p>
              <p>
                <strong>Customer:</strong> {selectedOrder.customer}
              </p>
              <p>
                <strong>Address:</strong> {selectedOrder.address}
              </p>

              <Form.Group className="mt-3">
                <Form.Label>Select Driver</Form.Label>
                <Form.Select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  <option value="">-- Choose Driver --</option>
                  {sampleDrivers.map((driver) => (
                    <option key={driver.id} value={driver.name}>
                      {driver.name} ({driver.assignedDeliveries} assigned)
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitAssignment}>
            Assign
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CREATE ORDER MODAL */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Customer Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter customer name"
              value={newOrder.customer}
              onChange={(e) =>
                setNewOrder({ ...newOrder, customer: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Delivery Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter full address"
              value={newOrder.address}
              onChange={(e) =>
                setNewOrder({ ...newOrder, address: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Priority</Form.Label>
            <Form.Select
              value={newOrder.priority}
              onChange={(e) =>
                setNewOrder({ ...newOrder, priority: e.target.value })
              }
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateOrder}>
            Create Order
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default TrackOrders;
