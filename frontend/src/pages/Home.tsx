import { useState } from "react";
import { Button, Col, Container, Nav, Offcanvas, Row } from "react-bootstrap";

const navItems = [
  { label: "Dashboard", icon: "bi-speedometer2" },
  { label: "Track Orders", icon: "bi-truck" },
  { label: "Plan Routes", icon: "bi-map" },
  { label: "Invoices", icon: "bi-currency-dollar" },
  { label: "Settings", icon: "bi-gear" },
];

{/*
  SHOWS THE MAIN dashboard after login. ADJUSTS TO MOBILE AND DESKTOP.
*/}
function Home() {
  const [showMenu, setShowMenu] = useState(false);
  const handleClose = () => setShowMenu(false);
  const handleShow = () => setShowMenu(true);

  return (
    <>
      {/* Top Navbar for Desktop */}
      <div className="d-none d-lg-flex justify-content-between align-items-center p-3 bg-dark text-light border-bottom">
        <Button variant="outline-light" onClick={handleShow}>
          <i className="bi bi-list"></i>
        </Button>
        <div className="fw-bold"></div>
        <div style={{ width: "2rem" }} />
      </div>

      {/* Mobile Navbar */}
      <div className="d-flex d-lg-none justify-content-between align-items-center p-3 bg-dark text-light">
        <Button variant="outline-light" onClick={handleShow}>
          <i className="bi bi-list"></i>
        </Button>
        <div className="fw-bold">Navigation</div>
        <div style={{ width: "2rem" }} />
      </div>

      {/* Sliding Sidebar for both mobile and desktop */}
      <Offcanvas show={showMenu} onHide={handleClose} placement="start" className="bg-dark text-light">
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {navItems.map((item) => (
              <Nav.Link
                key={item.label}
                href={`#${item.label.toLowerCase()}`}
                className="text-white py-3 border-bottom"
                onClick={handleClose}
              >
                <i className={`bi ${item.icon} me-2`} />
                {item.label}
              </Nav.Link>
            ))}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content Area - Full Width */}
      <Container fluid className="p-4">
        <Row>
          <Col>
            <h1 className="mb-4">Dashboard</h1>
            <div className="row">
              <div className="col-md-4 mb-4">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-speedometer2 me-2"></i>
                      Overview
                    </h5>
                    <p className="card-text">Logistics dashboard.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-4">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-truck me-2"></i>
                      Track Orders
                    </h5>
                    <p className="card-text">Monitor your shipments in real-time.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-4">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-map me-2"></i>
                      Plan Routes
                    </h5>
                    <p className="card-text">Optimize delivery routes efficiently.</p>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Home;