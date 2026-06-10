import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Alert } from "react-bootstrap";
import {
  registerWorker,
  createDriver,
  getCurrentRole,
  getHubs,
  getDrivers,
  type DriverRef,
  type HubRef,
} from "../services/api";
import FormModal from "../components/FormModal";
import {
  Labeled,
  inputStyle,
  Th,
  Td,
  pageHeaderRow,
  newButton,
} from "../components/FormBits";

type Role = "driver" | "dispatcher" | "billing" | "manager";

const [showPassword, setShowPassword] = useState(false);

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "driver", label: "Driver" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "billing", label: "Billing" },
  { value: "manager", label: "Manager" },
];

const EMPTY_FORM = {
  role: "driver" as Role,
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  hubId: "",
};

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
          Account created
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
              onClick={() => navigate("/register")}
            >
              Back to workers
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

  const [drivers, setDrivers] = useState<DriverRef[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedCredentials | null>(null);
  const [hubs, setHubs] = useState<HubRef[]>([]);

  const isDriver = form.role === "driver";
  const currentRole = getCurrentRole();

  const loadDrivers = useCallback(async () => {
    setListError(null);

    try {
      const res = await getDrivers();
      setDrivers(res.items);
    } catch (e: any) {
      setListError(e.message || "Failed to load workers");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  useEffect(() => {
    if (form.role === "driver" && hubs.length === 0) {
      getHubs()
        .then((h) => setHubs(h.items))
        .catch(() => {
          /* non-blocking */
        });
    }
  }, [form.role, hubs.length]);

  if (currentRole !== "manager") {
    return (
      <Container
        className="d-flex align-items-center justify-content-center"
        style={centerContainer}
      >
        <div className="text-center" style={{ color: "var(--font-color)" }}>
          <h4 className="mb-3">Access denied</h4>

          <p style={mutedText}>Only managers can create new accounts.</p>

          <Button variant="primary" onClick={() => navigate("/home")}>
            Back to dashboard
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
          setForm({ ...EMPTY_FORM });
          setError(null);
          setOpen(true);
        }}
      />
    );
  }

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setError(null);
  };

  const openModal = () => {
    resetForm();
    setOpen(true);
  };

  const closeModal = () => {
    if (loading) return;
    setOpen(false);
    resetForm();
  };

  const handleGenerate = () => {
    setForm((current) => ({ ...current, password: generatePassword() }));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (isDriver && (!form.firstName.trim() || !form.lastName.trim())) {
      setError("First and last name are required for drivers.");
      return;
    }

    setLoading(true);

    try {
      if (isDriver) {
        await createDriver({
          email: form.email.trim(),
          password: form.password,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: form.phone.trim() || null,
          hub_id: form.hubId.trim() || null,
        });
      } else {
        await registerWorker({
          email: form.email.trim(),
          password: form.password,
          role: form.role as "dispatcher" | "billing" | "manager",
        });
      }

      setOpen(false);
      await loadDrivers();
      setCreated({
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={pageHeaderRow}>
        <div>
          <h1 style={{ margin: 0, color: "var(--font-color)" }}>Workers</h1>

          <p style={mutedText}>
            Manage worker accounts used by the logistics platform
            {!loadingList &&
              ` · ${drivers.length} driver${drivers.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <button style={newButton} onClick={openModal}>
          + Add User
        </button>
      </div>

      {listError && <div style={errorBox}>{listError}</div>}

      {loadingList ? (
        <p style={mutedText}>Loading…</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderStyle}>
              <Th>Reference</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Hub</Th>
              <Th>Role</Th>
              <Th>Status</Th>
            </tr>
          </thead>

          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id} style={tableRowStyle}>
                <Td>{driver.reference}</Td>
                <Td>
                  {driver.first_name} {driver.last_name}
                </Td>
                <Td>{driver.email}</Td>
                <Td>{driver.phone ?? "—"}</Td>
                <Td>{getHubLabel(driver.hub_id, hubs)}</Td>
                <Td>Driver</Td>
                <Td>{driver.is_active ? "Active" : "Inactive"}</Td>
              </tr>
            ))}

            {drivers.length === 0 && (
              <tr>
                <Td colSpan={7}>No workers yet. Create one to get started.</Td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <FormModal
        open={open}
        title="New worker"
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={loading}
        submitLabel="Create account"
        error={error}
      >
        <Labeled label="Role">
          <select
            style={themedInput}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            disabled={loading}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Labeled>

        <Labeled label="Email *">
          <input
            style={themedInput}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="worker@transvirex.com"
            disabled={loading}
          />
        </Labeled>

        {isDriver && (
          <>
            <div style={twoColumnRow}>
              <Labeled label="First name *">
                <input
                  style={themedInput}
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  placeholder="Marie"
                  disabled={loading}
                />
              </Labeled>

              <Labeled label="Last name *">
                <input
                  style={themedInput}
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  placeholder="Dupont"
                  disabled={loading}
                />
              </Labeled>
            </div>

            <Labeled label="Phone">
              <input
                style={themedInput}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
                disabled={loading}
              />
            </Labeled>

            <Labeled label="Hub">
              <select
                style={themedInput}
                value={form.hubId}
                onChange={(e) => setForm({ ...form, hubId: e.target.value })}
                disabled={loading}
              >
                <option value="">Unassigned</option>
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.code} — {hub.name}
                  </option>
                ))}
              </select>
            </Labeled>
          </>
        )}

        <Labeled label="Temporary password *">
          <div style={passwordRow}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                style={{ ...themedInput, width: "100%", paddingRight: 42 }}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter or generate a temporary password"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                disabled={loading}
                style={eyeButton}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`bi ${showPassword ? "bi bi-eye-slash" : "bi bi-eye"}`} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              style={generateButton}
              title="Generate a strong random password"
            >
              ✨ Generate
            </button>
          </div>
        </Labeled>
      </FormModal>
    </div>
  );
}

function getHubLabel(hubId: string | null, hubs: HubRef[]) {
  if (!hubId) return "—";
  const hub = hubs.find((h) => h.id === hubId);
  return hub ? `${hub.code} — ${hub.name}` : hubId;
}

const pageStyle: React.CSSProperties = {
  padding: 24,
  color: "var(--font-color)",
};

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

const mutedText: React.CSSProperties = {
  color: "color-mix(in srgb, var(--font-color) 65%, transparent)",
  margin: "4px 0 0",
};

const helperText: React.CSSProperties = {
  color: "color-mix(in srgb, var(--font-color) 68%, transparent)",
  fontSize: 13,
};

const errorBox: React.CSSProperties = {
  background: "color-mix(in srgb, #ef4444 16%, var(--bg-color))",
  color: "#ef4444",
  border: "1px solid color-mix(in srgb, #ef4444 40%, transparent)",
  padding: "10px 14px",
  borderRadius: 8,
  marginBottom: 16,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  color: "var(--font-color)",
};

const tableHeaderStyle: React.CSSProperties = {
  background: "var(--selected-color)",
  color: "var(--font-color)",
  textAlign: "left",
};

const tableRowStyle: React.CSSProperties = {
  borderBottom:
    "1px solid color-mix(in srgb, var(--font-color) 12%, transparent)",
};

const themedInput: React.CSSProperties = {
  ...inputStyle,
  width: "100%",
  background: "var(--selected-color)",
  color: "var(--font-color)",
  border: "1px solid color-mix(in srgb, var(--font-color) 20%, transparent)",
};

const twoColumnRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const passwordRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
};

const generateButton: React.CSSProperties = {
  background: "transparent",
  color: "var(--font-color)",
  border: "1px solid color-mix(in srgb, var(--font-color) 28%, transparent)",
  borderRadius: 6,
  padding: "8px 12px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
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
