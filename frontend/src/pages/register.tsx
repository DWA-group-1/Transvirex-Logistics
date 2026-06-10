import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Form, Alert } from "react-bootstrap";
import {
  registerWorker,
  createDriver,
  getCurrentRole,
  getHubs,
  type HubRef,
} from "../services/api";

type Role = "driver" | "dispatcher" | "billing" | "manager";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "driver", label: "Driver" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "billing", label: "Billing" },
  { value: "manager", label: "Manager" },
];

function generatePassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()-_=+";
  const all = upper + lower + digits + symbols;

  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const rest = Array.from(
    { length: 8 },
    () => all[Math.floor(Math.random() * all.length)],
  );

  return [...required, ...rest].sort(() => Math.random() - 0.5).join("");
}

interface CreatedCredentials {
  email: string;
  password: string;
  role: Role;
}

function CredentialsScreen({
  credentials,
  onAddAnother,
}: {
  credentials: CreatedCredentials;
  onAddAnother: () => void;
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const loginBlock = `Transvirex Logistics — Login Credentials\n\nEmail:    ${credentials.email}\nPassword: ${credentials.password}\nRole:     ${credentials.role}\n\nThis password is temporary. You will be asked to change it on first login.`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(loginBlock);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={centerContainer}
    >
      <div className="container-fluid">
        <h4 className="mb-4 fw-bold" style={{ color: "var(--font-color)" }}>
          Account Created
        </h4>

        <div style={panelStyle}>
          <Alert variant="warning" className="mb-4">
            <i className="bi bi-exclamation-triangle-fill me-2" />
            These credentials are shown <strong>one time only</strong>. Copy
            them before leaving this screen.
          </Alert>

          <div style={credentialsBox}>
            <CredentialItem label="Email" value={credentials.email} />
            <hr style={hrStyle} />
            <CredentialItem
              label="Temporary password"
              value={credentials.password}
            />
            <hr style={hrStyle} />
            <CredentialItem label="Role" value={credentials.role} capitalize />
          </div>

          <p style={mutedText}>
            The worker must change this password on their first login.
          </p>

          <div className="d-flex flex-column gap-3">
            <Button variant="primary" size="lg" onClick={handleCopy}>
              <i className="bi bi-clipboard me-2" />
              {copied ? "Copied!" : "Copy login info"}
            </Button>

            <Button variant="outline-primary" size="lg" onClick={onAddAnother}>
              <i className="bi bi-person-plus me-2" />
              Add another worker
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/home")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

function CredentialItem({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <span style={mutedText}>{label}</span>
      <br />
      <strong style={{ textTransform: capitalize ? "capitalize" : undefined }}>
        {value}
      </strong>
    </div>
  );
}

function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>("driver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedCredentials | null>(null);
  const [hubId, setHubId] = useState("");
  const [hubs, setHubs] = useState<HubRef[]>([]);

  const isDriver = role === "driver";
  const currentRole = getCurrentRole();

  useEffect(() => {
    if (role === "driver" && hubs.length === 0) {
      getHubs()
        .then((h) => setHubs(h.items))
        .catch(() => {
          /* non-blocking */
        });
    }
  }, [role, hubs.length]);

  if (currentRole !== "manager") {
    return (
      <Container
        className="d-flex align-items-center justify-content-center"
        style={centerContainer}
      >
        <div className="text-center" style={{ color: "var(--font-color)" }}>
          <h4 className="mb-3">Access Denied</h4>

          <p style={mutedText}>Only managers can create new accounts.</p>

          <Button variant="primary" onClick={() => navigate("/home")}>
            Back to Dashboard
          </Button>
        </div>
      </Container>
    );
  }

  if (created) {
    return (
      <CredentialsScreen
        credentials={created}
        onAddAnother={() => {
          setCreated(null);
          setRole("driver");
          setEmail("");
          setPassword("");
          setFirstName("");
          setLastName("");
          setPhone("");
          setHubId("");
          setError(null);
        }}
      />
    );
  }

  const handleGenerate = () => setPassword(generatePassword());

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (isDriver && (!firstName.trim() || !lastName.trim())) {
      setError("First and last name are required for drivers.");
      return;
    }

    setLoading(true);

    try {
      if (isDriver) {
        await createDriver({
          email: email.trim(),
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          hub_id: hubId.trim() || null,
        });
      } else {
        await registerWorker({
          email: email.trim(),
          password,
          role: role as "dispatcher" | "billing" | "manager",
        });
      }

      setCreated({ email: email.trim(), password, role });
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={centerContainer}
    >
      <div className="container-fluid">
        <h4
          className="mb-4 fw-bold text-center"
          style={{ color: "var(--font-color)" }}
        >
          Create Worker Account
        </h4>

        <Form style={panelStyle} onSubmit={handleSubmit}>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Form.Group className="mb-4">
            <Form.Label style={labelStyle} htmlFor="registerRole">
              Role
            </Form.Label>

            <Form.Select
              id="registerRole"
              size="lg"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={loading}
              style={inputStyle}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label style={labelStyle} htmlFor="registerEmail">
              Email
            </Form.Label>

            <Form.Control
              type="email"
              id="registerEmail"
              placeholder="worker@transvirex.com"
              size="lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={inputStyle}
            />
          </Form.Group>

          {isDriver && (
            <>
              <div className="d-flex gap-3 mb-4">
                <Form.Group className="flex-fill">
                  <Form.Label style={labelStyle} htmlFor="registerFirstName">
                    First name
                  </Form.Label>

                  <Form.Control
                    id="registerFirstName"
                    placeholder="Marie"
                    size="lg"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    style={inputStyle}
                  />
                </Form.Group>

                <Form.Group className="flex-fill">
                  <Form.Label style={labelStyle} htmlFor="registerLastName">
                    Last name
                  </Form.Label>

                  <Form.Control
                    id="registerLastName"
                    placeholder="Dupont"
                    size="lg"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    style={inputStyle}
                  />
                </Form.Group>
              </div>

              <Form.Group className="mb-4">
                <Form.Label style={labelStyle} htmlFor="registerPhone">
                  Phone (optional)
                </Form.Label>

                <Form.Control
                  id="registerPhone"
                  placeholder="+33 6 12 34 56 78"
                  size="lg"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  style={inputStyle}
                />
              </Form.Group>
            </>
          )}

          <Form.Group className="mb-4">
            <Form.Label style={labelStyle} htmlFor="registerHub">
              Hub (optional)
            </Form.Label>
            <Form.Select
              id="registerHub"
              size="lg"
              value={hubId}
              onChange={(e) => setHubId(e.target.value)}
              disabled={loading}
              style={inputStyle}
            >
              <option value="">Unassigned</option>
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.code} — {h.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label style={labelStyle} htmlFor="registerPassword">
              Temporary Password
            </Form.Label>

            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                id="registerPassword"
                placeholder="Enter or generate a temporary password"
                size="lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={inputStyle}
              />

              <Button
                variant="outline-secondary"
                size="lg"
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                title="Generate a strong random password"
                style={{ whiteSpace: "nowrap" }}
              >
                <i className="bi bi-stars me-1" />
                Generate
              </Button>
            </div>

            <Form.Text style={mutedText}>
              The worker will be asked to change this on first login.
            </Form.Text>
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
              type="button"
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

const centerContainer: React.CSSProperties = {
  minHeight: "100vh",
  maxWidth: "455px",
  color: "var(--font-color)",
};

const panelStyle: React.CSSProperties = {
  background: "color-mix(in srgb, var(--selected-color) 55%, transparent)",
  border: "1px solid color-mix(in srgb, var(--font-color) 16%, transparent)",
  color: "var(--font-color)",
  padding: 24,
  borderRadius: 16,
};

const labelStyle: React.CSSProperties = {
  color: "var(--font-color)",
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  background: "var(--selected-color)",
  color: "var(--font-color)",
  border: "1px solid color-mix(in srgb, var(--font-color) 20%, transparent)",
};

const mutedText: React.CSSProperties = {
  color: "color-mix(in srgb, var(--font-color) 68%, transparent)",
};

const credentialsBox: React.CSSProperties = {
  background: "var(--selected-color)",
  color: "var(--font-color)",
  border: "1px solid color-mix(in srgb, var(--font-color) 16%, transparent)",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  fontFamily: "monospace",
  fontSize: 14,
  lineHeight: 1.8,
};

const hrStyle: React.CSSProperties = {
  borderColor: "color-mix(in srgb, var(--font-color) 18%, transparent)",
};

export default Register;

