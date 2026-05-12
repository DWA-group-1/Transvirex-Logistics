import { useState } from "react";
import { Button, Col, Container, Nav, Offcanvas, Row } from "react-bootstrap";

const navItems = [
  { label: "Dashboard", icon: "bi-speedometer2" },
  { label: "Shipments", icon: "bi-truck" },
  { label: "Rates", icon: "bi-currency-dollar" },
  { label: "Settings", icon: "bi-gear" },
];

function Home() {
  const [showMenu, setShowMenu] = useState(false);
  const handleClose = () => setShowMenu(false);
  const handleShow = () => setShowMenu(true);

  return (
    <>
      <div className="d-flex d-lg-none justify-content-between align-items-center p-3 bg-dark text-light">
        <Button variant="outline-light" onClick={handleShow}>
          <i className="bi bi-list"></i>
        </Button>
        <div className="fw-bold">Navigation</div>
        <div style={{ width: "2rem" }} />
      </div>

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

      <Container fluid className="p-0">
        <Row className="g-0">
          <Col lg={3} xl={2} className="d-none d-lg-flex vh-100 flex-column bg-dark text-light p-4 border-end">
            <div className="mb-4 text-uppercase fw-bold fs-6">Navigation</div>
            <Nav className="flex-column">
              {navItems.map((item) => (
                <Nav.Link
                  key={item.label}
                  href={`#${item.label.toLowerCase()}`}
                  className="text-white py-3 border-bottom"
                >
                  <i className={`bi ${item.icon} me-2`} />
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>
          </Col>
          <Col className="d-none d-lg-block">
            <div className="p-4" />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Home;