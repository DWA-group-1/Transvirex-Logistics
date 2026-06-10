import { Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <Container
      className="d-flex flex-column justify-content-center align-items-center text-center"
      style={{ minHeight: "100vh" }}
    >
      <img
        src="../../public/leaf-svgrepo-com.svg"
        alt="Transvirex"
        height={80}
        className="mb-4"
      />

      <h1
        style={{
          fontSize: "7rem",
          color: "#198754",
          fontWeight: "bold",
        }}
      >
        404
      </h1>

      <h3>Lost on the route?</h3>

      <p className="text-muted">
        This delivery destination could not be found.
      </p>

      <Button as={Link} to="/home" variant="success">
        Return to Dashboard
      </Button>
    </Container>
  );
}