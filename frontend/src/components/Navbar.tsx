import { Container, Navbar as BootstrapNavbar, Form, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Nav, Offcanvas } from "react-bootstrap";

const navItems = [
  { label: "Dashboard", icon: "bi-speedometer2" },
  { label: "Track Orders", icon: "bi-truck" },
  { label: "Plan Routes", icon: "bi-map" },
  { label: "Invoices", icon: "bi-currency-dollar" },
  { label: "Settings", icon: "bi-gear" },
];

function Navbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  
  const handleClose = () => setShowMenu(false);
  const handleShow = () => setShowMenu(true);
  
  // Add type for the form event
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Searching for: ${searchTerm}`);
    setSearchTerm("");
  };

  return (
    <>
      <BootstrapNavbar bg="dark" variant="dark" expand="lg">
        <Container fluid className="d-flex align-items-center py-2">
          {/* Single burger menu button - always visible */}
          <Button 
            variant="outline-light" 
            onClick={handleShow}
            className="me-2"
            aria-label="Open navigation menu"
          >
            <i className="bi bi-list"></i>
          </Button>

          <BootstrapNavbar.Brand
            as={Link}
            to="/home"
            className="d-flex align-items-center justify-content-center"
          >
            <img
              src="leaf-svgrepo-com.svg"
              height="40"
              className="me-2"
              alt="Logo"
            />
            <span className="text-light fw-bold">Transvirex Logistics</span>
          </BootstrapNavbar.Brand>

          {/* Right side controls - search and settings */}
          <div className="ms-auto d-flex align-items-center gap-2">
            <Form onSubmit={handleSearch} className="d-flex">
              <Form.Control
                type="search"
                placeholder="Search..."
                className="me-2"
                aria-label="Search Bar"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
              <Button type="submit" variant="success">
                <i className="bi bi-search"></i>
              </Button>
            </Form>

            <Button variant="info">
              <i className="bi bi-gear-wide"></i>
            </Button>
          </div>
        </Container>
      </BootstrapNavbar>

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
    </>
  );
}

export default Navbar;