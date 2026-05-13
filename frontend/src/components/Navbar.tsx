import { Container, Navbar as BootstrapNavbar, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Nav, Offcanvas } from "react-bootstrap";

const navItems = [
  { label: "Dashboard", icon: "bi-speedometer2" },
  { label: "Track Orders", icon: "bi-truck" },
  { label: "Plan Routes", icon: "bi-map" },
  { label: "Invoices", icon: "bi-currency-dollar" },
  { label: "Settings", icon: "bi-gear" },
];

function Navbar() {
  const [showMenu, setShowMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? savedMode === 'true' : true;
  });
  
  const handleClose = () => setShowMenu(false);
  const handleShow = () => setShowMenu(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Apply theme to body when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('bg-dark', 'text-light');
      document.body.classList.remove('bg-light', 'text-dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.add('bg-light', 'text-dark');
      document.body.classList.remove('bg-dark', 'text-light');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  // Navbar colors are OPPOSITE of the theme
  const navbarIsDark = !isDarkMode; // When dark mode is ON, navbar is LIGHT

  return (
    <>
      <BootstrapNavbar 
        bg={navbarIsDark ? "dark" : "light"} 
        variant={navbarIsDark ? "dark" : "light"} 
        expand="lg"
        style={{
          backgroundColor: navbarIsDark ? '#212529' : '#f8f9fa',
          transition: 'background-color 0.3s ease'
        }}
      >
        <Container fluid className="py-2">
          <div className="d-flex w-100 align-items-center">
            
            {/* LEFT COLUMN - Burger menu */}
            <div className="flex-grow-1" style={{ flex: 1 }}>
              <Button 
                variant={navbarIsDark ? "outline-light" : "outline-dark"} 
                onClick={handleShow}
                aria-label="Open navigation menu"
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
                  src="leaf-svgrepo-com.svg"
                  height="40"
                  className="me-2"
                  alt="Logo"
                  style={{ 
                    // Logo stays GREEN in both modes - NO filter applied!
                    filter: 'none'
                  }}
                />
                <span className="fw-bold" style={{ 
                  // Text color adapts to navbar background for contrast
                  color: navbarIsDark ? '#ffffff' : '#000000'
                }}>
                  Transvirex Logistics
                </span>
              </BootstrapNavbar.Brand>
            </div>

            {/* RIGHT COLUMN - Dark/Light Mode Toggle Button */}
            <div className="flex-grow-1" style={{ flex: 1 }}>
              <div className="d-flex justify-content-end">
                <Button 
                  variant={navbarIsDark ? "outline-light" : "outline-dark"}
                  onClick={toggleTheme}
                  aria-label="Toggle dark/light mode"
                >
                  {isDarkMode ? (
                    <>
                      <i className="bi bi-sun-fill me-1"></i>
                      <span className="d-none d-md-inline">Light Mode</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-moon-fill me-1"></i>
                      <span className="d-none d-md-inline">Dark Mode</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
          </div>
        </Container>
      </BootstrapNavbar>

      {/* Offcanvas Menu - follows the actual theme */}
      <Offcanvas 
        show={showMenu} 
        onHide={handleClose} 
        placement="start" 
        className={isDarkMode ? "bg-dark text-light" : "bg-light text-dark"}
      >
        <Offcanvas.Header closeButton closeVariant={isDarkMode ? "white" : "black"}>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {navItems.map((item) => (
              <Nav.Link
                key={item.label}
                href={`#${item.label.toLowerCase()}`}
                className={`py-3 border-bottom ${isDarkMode ? 'text-light' : 'text-dark'}`}
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