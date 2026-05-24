import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Form, Alert } from "react-bootstrap";
import { register, getCurrentRole } from "../services/api";

type Role = "driver" | "dispatcher" | "billing" | "manager";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "driver", label: "Driver" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "billing", label: "Billing" },
  { value: "manager", label: "Manager" },
];

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("driver");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Gate the page: only managers may see it
  const currentRole = getCurrentRole();
  if (currentRole !== "manager") {
    return (
      <Container
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="text-center">
          <h4 className="mb-3">Access Denied</h4>
          <p className="text-muted mb-4">
            Only managers can create new accounts.
          </p>
          <Button variant="primary" onClick={() => navigate("/home")}>
            Back to Dashboard
          </Button>
        </div>
      </Container>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const user = await register(email, password, role);
      setSuccess(`Account created for ${user.email} (${user.role}).`);
      setEmail("");
      setPassword("");
      setRole("driver");
    } catch (err: any) {
      setError(err?.message ?? JSON.stringify(err) ?? "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", maxWidth: "455px" }}
    >
      <div className="container-fluid">
        <h4 className="mb-4 fw-bold">Create Worker Account</h4>

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
              placeholder="worker@example.com"
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
              placeholder="Set a password for the worker"
              size="lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label htmlFor="registerRole" size="lg">
              Role
            </Form.Label>
            <Form.Select
              id="registerRole"
              size="lg"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={loading}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="d-flex flex-column align-items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating…" : "Create Account"}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/home")}
              disabled={loading}
            >
              Back to Dashboard
            </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default Register;
