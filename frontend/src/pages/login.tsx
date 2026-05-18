import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim() && password.trim()) {
      navigate("/home");
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", maxWidth: "455px" }}
    >
      <div className="container-fluid h-custom">
        <div className="row d-flex justify-content-center align-items-center">
          <div className="col-md-15 col-lg-20 col-xl-30">
            <div
              className="d-flex align-items-center gap-15 mb-4"
              style={{ whiteSpace: "nowrap" }}
            >
              <img
                src="leaf-svgrepo-com.svg"
                height="65"
                className="me-3"
                alt="Logo"
                style={{
                  filter: "none",
                }}
              />
              <span
                className="fw-bold"
                style={{
                  color: "#000000",
                  fontSize: "2.2rem",
                }}
              >
                Transvirex Logistics
              </span>
            </div>
          </div>
        </div>
        <Form className="border border-dark p-4 rounded-4">
          <Form.Group className="mb-4">
            <Form.Label htmlFor="inputEmail" size="lg">
              Email
            </Form.Label>
            <Form.Control
              className="border border-dark rounded-3"
              type="Email"
              id="inputEmail"
              placeholder="email@example.com"
              aria-describedby="HelpConfigureEmailBlock"
              size="lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            ></Form.Control>
            <Form.Text id="HelpConfigureEmailBlock">
              Valid Email starting with username followed by @ followed by email
              followed by ".com"
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label htmlFor="inputPassword5" size="lg">
              Password
            </Form.Label>
            <Form.Control
              className="border border-dark rounded-3"
              type="password"
              id="inputPassword5"
              placeholder="Enter Password Here"
              aria-describedby="HelpConfigurePasswordBlock"
              size="lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            ></Form.Control>
            <Form.Text id="HelpConfigurePasswordBlock">
              Your password must be 8-20 characters long, contain letters and
              numbers, and must not contain spaces, special characters, or
              emoji.
            </Form.Text>
          </Form.Group>

          <div className="d-flex flex-column align-items-center justify-content-center gap-3">
            <Button variant="primary" size="lg" onClick={handleSubmit}>
              Login
            </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default Login;
