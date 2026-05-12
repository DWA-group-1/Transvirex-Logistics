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
    <BootstrapNavbar bg="dark" variant="dark" expand="lg">
      <Container>
        {/* LOGO AND WEBSITE NAME */}
        <BootstrapNavbar.Brand as={Link} to="/home">
          <img
            src="leaf-svgrepo-com.svg"  
            height="75"     
            className="d-inline-block align-middle"
            alt="Logo"
          /> 
          <span className="ms-2 text-light">Transvirex Logistics</span>
        </BootstrapNavbar.Brand>
      
        {/* SEARCH BAR */}
        <Form onSubmit={handleSearch} className="d-flex ms-auto me-2">
          <Form.Control
            type="search"
            placeholder="Search..."
            className="me-2"
            aria-label="Search Bar"
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}  // ← Add type here too
          />
          <Button type="submit" variant="success">
            <i className="bi bi-search"></i>
          </Button>
        </Form>

        {/* SETTINGS BUTTON */}
        <Button variant="info">
          <i className="bi bi-gear-wide"></i>
        </Button>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar;