import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Form, Alert } from "react-bootstrap";
import { login } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate("/home");
    } catch (err: any) {
      setError(err.message || "Connection error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", maxWidth: "455px" }}
    >
      <div className="container-fluid h-custom">
        {/* Brand header */}
        <div
          className="d-flex align-items-center gap-3 mb-4"
          style={{ whiteSpace: "nowrap" }}
        >
          <img
            src="/leaf-svgrepo-com.svg"
            height="65"
            className="me-3"
            alt="Logo"
          />
          <span
            className="fw-bold"
            style={{ color: "#000000", fontSize: "2.2rem" }}
          >
            Transvirex Logistics
          </span>
        </div>

        <Form
          className="border border-dark p-4 rounded-4"
          onSubmit={handleSubmit}
        >
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Form.Group className="mb-4">
            <Form.Label htmlFor="inputEmail" size="lg">
              Email
            </Form.Label>
            <Form.Control
              className="border border-dark rounded-3"
              type="email"
              id="inputEmail"
              placeholder="email@example.com"
              size="lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label htmlFor="inputPassword" size="lg">
              Password
            </Form.Label>
            <Form.Control
              className="border border-dark rounded-3"
              type="password"
              id="inputPassword"
              placeholder="Enter your password"
              size="lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          <div className="d-flex flex-column align-items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in…" : "Login"}
            </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default Login;
