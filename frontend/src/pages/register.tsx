import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Alert } from "react-bootstrap";
import {
  registerWorker,
  createDriver,
  getCurrentRole,
  getHubs,
  getDrivers,
  updateDriver,
  deactivateDriver,
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
  onBackToWorkers,
}: {
  credentials: CreatedCredentials;
  onAddAnother: () => void;
  onBackToWorkers: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const loginBlock = `Transvirex Logistics — Login Credentials\n\nEmail:    ${credentials.email}\nPassword: ${credentials.password}\nRole:     ${credentials.role}\n\nThis password is temporary. You will be asked to change it on first login.`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(loginBlock);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold m-0" style={{ color: "var(--font-color)" }}>
            Account created
          </h4>

          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onBackToWorkers}
          />
        </div>

        <Alert variant="warning" className="mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2" />
          These credentials are shown <strong>one time only</strong>. Copy them
          before leaving this screen.
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

          <Button variant="secondary" size="lg" onClick={onBackToWorkers}>
            Back to workers
          </Button>
        </div>
      </div>
    </div>
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedCredentials | null>(null);
  const [hubs, setHubs] = useState<HubRef[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    hub_id: "",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const isDriver = form.role === "driver";
  const currentRole = getCurrentRole();

  const loadDrivers = useCallback(async () => {
    setListError(null);
    try {
      const res = await getDrivers(undefined, showInactive);
      setDrivers(res.items);
    } catch (e: any) {
      setListError(e.message || "Failed to load workers");
    } finally {
      setLoadingList(false);
    }
  }, [showInactive]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  useEffect(() => {
    getHubs()
      .then((h) => setHubs(h.items))
      .catch(() => {});
  }, []);

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

  const openEdit = (d: DriverRef) => {
    setEditingId(d.id);
    setEditForm({
      first_name: d.first_name,
      last_name: d.last_name,
      phone: d.phone ?? "",
      hub_id: d.hub_id ?? "",
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      setEditError("First and last name are required.");
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await updateDriver(editingId!, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone: editForm.phone.trim() || null,
        hub_id: editForm.hub_id || null,
      });
      setEditOpen(false);
      await loadDrivers();
    } catch (e: any) {
      setEditError(e.message || "Failed to update driver");
    } finally {
      setEditSubmitting(false);
    }
  };

  const toggleActive = async (d: DriverRef) => {
    setBusyId(d.id);
    try {
      if (d.is_active) await deactivateDriver(d.id);
      else await updateDriver(d.id, { is_active: true });
      await loadDrivers();
    } catch (e: any) {
      setListError(e.message || "Failed to update driver");
    } finally {
      setBusyId(null);
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

      <label
        style={{
          display: "inline-flex",
          gap: 6,
          alignItems: "center",
          margin: "8px 0 16px",
          fontSize: 14,
          cursor: "pointer",
          color: "var(--font-color)",
        }}
      >
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
        />
        Show inactive
      </label>

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
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr
                key={driver.id}
                style={{
                  ...tableRowStyle,
                  opacity: driver.is_active ? 1 : 0.55,
                }}
              >
                <Td>{driver.reference}</Td>
                <Td>
                  {driver.first_name} {driver.last_name}
                </Td>
                <Td>{driver.email}</Td>
                <Td>{driver.phone ?? "—"}</Td>
                <Td>{getHubLabel(driver.hub_id, hubs)}</Td>
                <Td>Driver</Td>
                <Td>{driver.is_active ? "Active" : "Inactive"}</Td>
                <Td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={linkBtn} onClick={() => openEdit(driver)}>
                      Edit
                    </button>
                    <button
                      style={driver.is_active ? dangerBtn : linkBtn}
                      disabled={busyId === driver.id}
                      onClick={() => toggleActive(driver)}
                    >
                      {busyId === driver.id
                        ? "…"
                        : driver.is_active
                          ? "Deactivate"
                          : "Reactivate"}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <Td colSpan={8}>No workers yet. Create one to get started.</Td>
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
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                />
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

      <FormModal
        open={editOpen}
        title="Edit driver"
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        submitting={editSubmitting}
        submitLabel="Save changes"
        error={editError}
      >
        <Labeled label="First name *">
          <input
            style={themedInput}
            value={editForm.first_name}
            onChange={(e) =>
              setEditForm({ ...editForm, first_name: e.target.value })
            }
          />
        </Labeled>
        <Labeled label="Last name *">
          <input
            style={themedInput}
            value={editForm.last_name}
            onChange={(e) =>
              setEditForm({ ...editForm, last_name: e.target.value })
            }
          />
        </Labeled>
        <Labeled label="Phone">
          <input
            style={themedInput}
            value={editForm.phone}
            onChange={(e) =>
              setEditForm({ ...editForm, phone: e.target.value })
            }
          />
        </Labeled>
        <Labeled label="Hub">
          <select
            style={themedInput}
            value={editForm.hub_id}
            onChange={(e) =>
              setEditForm({ ...editForm, hub_id: e.target.value })
            }
          >
            <option value="">Unassigned</option>
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.code} — {h.name}
              </option>
            ))}
          </select>
        </Labeled>
      </FormModal>

      {created && (
        <CredentialsScreen
          credentials={created}
          onAddAnother={() => {
            setCreated(null);
            setForm({ ...EMPTY_FORM });
            setError(null);
            setOpen(true);
          }}
          onBackToWorkers={() => {
            setCreated(null);
            setForm({ ...EMPTY_FORM });
            setError(null);
          }}
        />
      )}
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

const mutedText: React.CSSProperties = {
  color: "color-mix(in srgb, var(--font-color) 65%, transparent)",
  margin: "4px 0 0",
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

const eyeButton: React.CSSProperties = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  border: "none",
  background: "transparent",
  color: "var(--font-color)",
  cursor: "pointer",
  padding: 0,
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1050,
  background: "rgba(0, 0, 0, 0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const modalCard: React.CSSProperties = {
  width: "100%",
  maxWidth: 430,
  background: "var(--bg-color)",
  color: "var(--font-color)",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
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

const linkBtn: React.CSSProperties = {
  background: "none",
  border: "1px solid color-mix(in srgb, var(--font-color) 25%, transparent)",
  color: "var(--font-color)",
  borderRadius: 6,
  padding: "4px 10px",
  fontSize: 13,
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  ...linkBtn,
  color: "#ef4444",
  borderColor: "color-mix(in srgb, #ef4444 40%, transparent)",
};

export default Register;
