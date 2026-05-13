import { Container, Navbar as BootstrapNavbar, Form, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";  

function Navbar() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Add type for the form event
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Searching for: ${searchTerm}`);
    setSearchTerm("");
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark">
      <Container fluid className="position-relative d-flex align-items-center py-2">
        <Button variant="outline-light" className="me-2" aria-label="Open navigation menu">
          <i className="bi bi-list"></i>
        </Button>

        <BootstrapNavbar.Brand
          as={Link}
          to="/home"
          className="position-absolute start-50 translate-middle-x d-flex align-items-center justify-content-center"
        >
          <img
            src="leaf-svgrepo-com.svg"
            height="40"
            className="me-2"
            alt="Logo"
          />
          <span className="text-light fw-bold">Transvirex Logistics</span>
        </BootstrapNavbar.Brand>

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
  );
}

export default Navbar;