import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Form, Alert } from "react-bootstrap";

// BACKEND API URL - Change if your auth service runs on a different URL
// The auth service is currently exposed on host port 8002 in compose.yml.
const API_BASE_URL = "http://localhost:8002";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // HANDLER - Login with backend API
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    // VALIDATION - Check fields are not empty
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      // STEP 1 - Send login request to backend
      // The backend expects form data with username (email) and password
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(`${API_BASE_URL}/token`, {
        method: "POST",
        body: formData,
      });

      // STEP 2 - Check if response is successful
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // STEP 3 - Extract token from response
      const data = await response.json();
      const { access_token } = data;

      // STEP 4 - Store token in localStorage for later API requests
      localStorage.setItem("authToken", access_token);
      localStorage.setItem("userEmail", email);

      // STEP 5 - Navigate to home page
      navigate("/home");
    } catch (err: any) {
      // STEP 6 - Handle network or other errors
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
        <div className="row d-flex justify-content-center align-items-center">
          <div className="col-md-15 col-lg-20 col-xl-30">
            <div
              className="d-flex align-items-center gap-15 mb-4"
              style={{ whiteSpace: "nowrap" }}
            >
              <img
                src="/leaf-svgrepo-com.svg"
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
        <Form
          className="border border-dark p-4 rounded-4"
          onSubmit={handleSubmit}
        >
          {/* ERROR ALERT */}
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
              aria-describedby="HelpConfigureEmailBlock"
              size="lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
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
              disabled={loading}
            />
            <Form.Text id="HelpConfigurePasswordBlock">
              Your password must be 8-20 characters long, contain letters and
              numbers, and must not contain spaces, special characters, or
              emoji.
            </Form.Text>
          </Form.Group>

          <div className="d-flex flex-column align-items-center justify-content-center gap-3">
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/home")}
              disabled={loading}
            >
              Skip to Home (Test)
            </Button>
            <Button
              variant="outline-primary"
              size="lg"
              onClick={() => navigate("/register")}
              disabled={loading}
            >
              Create Account
            </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default Login;
