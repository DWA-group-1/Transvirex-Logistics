import { Container, Navbar as BootstrapNavbar, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Nav, Offcanvas } from "react-bootstrap";

const navItems = [
  { label: "Dashboard", icon: "bi-speedometer2", path: "/home" },
  { label: "Track Orders", icon: "bi-truck", path: "/track-orders" },
  { label: "Plan Routes", icon: "bi-map", path: "/plan-routes" },
  { label: "Invoices", icon: "bi-currency-dollar", path: "/track-invoices" },
  // { label: "Settings", icon: "bi-gear", path: "/settings" },
];

function Navbar() {
  const [showMenu, setShowMenu] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    // Get saved font size from localStorage or default to 100%
    const savedSize = localStorage.getItem("fontSize");
    return savedSize ? parseInt(savedSize) : 100;
  });

  const handleClose = () => setShowMenu(false);
  const handleShow = () => setShowMenu(true);

  // FUNCTION TO INCREASE THE FONT SIZE FOR PLUS BUTTON
  const increaseFontSize = () => {
    if (fontSize < 150) {
      const newSize = fontSize + 10;
      setFontSize(newSize);
      document.body.style.fontSize = `${newSize}%`;
      localStorage.setItem("fontSize", newSize.toString());
    }
  };

  // FUNCTION THAT DECREASES THE FONT SIZE FOR MINUS BUTTON
  const decreaseFontSize = () => {
    if (fontSize > 70) {
      const newSize = fontSize - 10;
      setFontSize(newSize);
      document.body.style.fontSize = `${newSize}%`;
      localStorage.setItem("fontSize", newSize.toString());
    }
  };

  // FUNCTION TO RESET TEXT SIZE TO DEFAULT
  const resetFontSize = () => {
    setFontSize(100);
    document.body.style.fontSize = "100%";
    localStorage.setItem("fontSize", "100");
  };

  // Apply saved font size on component mount
  useState(() => {
    document.body.style.fontSize = `${fontSize}%`;
  }, []);

  return (
    <>
      <BootstrapNavbar
        expand="lg"
        style={{
          backgroundColor: "#E2725B", // Terracotta color
          transition: "background-color 0.3s ease",
        }}
      >
        <Container fluid className="py-2">
          <div className="d-flex w-100 align-items-center">
            {/* LEFT COLUMN - Burger menu */}
            <div className="flex-grow-1" style={{ flex: 1 }}>
              <Button
                variant="outline-light"
                onClick={handleShow}
                aria-label="Open navigation menu"
                style={{
                  borderColor: "white",
                  color: "white",
                }}
              >
                <i className="bi bi-list"></i>
              </Button>
            </div>

            {/* CENTER COLUMN - Logo and Title */}
            <div className="text-center" style={{ flex: 1 }}>
              <BootstrapNavbar.Brand
                as={Link}
                to="/home"
                className="d-inline-flex align-items-center m-0"
              >
                <img
                  src="/leaf-svgrepo-com.svg"
                  height="40"
                  className="me-2"
                  alt="Logo"
                  style={{
                    filter: "none",
                  }}
                />
                <span
                  className="fw-bold"
                  style={{
                    color: "#ffffff", // White text for contrast against terracotta
                    fontSize: "1.2rem",
                  }}
                >
                  Transvirex Logistics
                </span>
              </BootstrapNavbar.Brand>
            </div>

            {/* RIGHT COLUMN - Accessibility Text Size Controls */}
            <div className="flex-grow-1" style={{ flex: 1 }}>
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="outline-light"
                  onClick={decreaseFontSize}
                  aria-label="Decrease text size"
                  style={{
                    borderColor: "white",
                    color: "white",
                  }}
                >
                  <i className="bi bi-dash-circle me-1"></i>
                  <span className="d-none d-md-inline">A-</span>
                </Button>

                <Button
                  variant="outline-light"
                  onClick={resetFontSize}
                  aria-label="Reset text size to default"
                  style={{
                    borderColor: "white",
                    color: "white",
                  }}
                >
                  <i className="bi bi-arrow-repeat me-1"></i>
                  <span className="d-none d-md-inline">Reset</span>
                </Button>

                <Button
                  variant="outline-light"
                  onClick={increaseFontSize}
                  aria-label="Increase text size"
                  style={{
                    borderColor: "white",
                    color: "white",
                  }}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  <span className="d-none d-md-inline">A+</span>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </BootstrapNavbar>

      {/* Offcanvas Menu */}
      <Offcanvas
        show={showMenu}
        onHide={handleClose}
        placement="start"
        className="bg-dark text-light"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {navItems.map((item) => (
              <Nav.Link
                key={item.label}
                as={Link}
                to={item.path}
                className="text-white py-3 border-bottom"
                onClick={handleClose}
                style={{
                  borderBottomColor: "#E2725B", // Terracotta accent on borders
                }}
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
