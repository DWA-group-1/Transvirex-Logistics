import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Form, Alert } from "react-bootstrap";

// Match the backend used by the running compose stack
const API_BASE_URL = "http://localhost:8002";

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Registration failed");
        setLoading(false);
        return;
      }

      setSuccess("User created — you can now log in.");
      setLoading(false);
      setTimeout(() => navigate("/"), 1000);
    } catch (err: any) {
      setError(err.message || "Connection error. Is the backend running?");
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", maxWidth: "455px" }}
    >
      <div className="container-fluid h-custom">
        <Form
          className="border border-dark p-4 rounded-4"
          onSubmit={handleSubmit}
        >
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              variant="success"
              onClose={() => setSuccess(null)}
              dismissible
            >
              {success}
            </Alert>
          )}

          <Form.Group className="mb-4">
            <Form.Label htmlFor="registerEmail" size="lg">
              Email
            </Form.Label>
            <Form.Control
              type="email"
              id="registerEmail"
              placeholder="email@example.com"
              size="lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label htmlFor="registerPassword" size="lg">
              Password
            </Form.Label>
            <Form.Control
              type="password"
              id="registerPassword"
              placeholder="Enter Password Here"
              size="lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          <div className="d-flex flex-column align-items-center justify-content-center gap-3">
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/")}
              disabled={loading}
            >
              Back to Login
            </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default Register;
