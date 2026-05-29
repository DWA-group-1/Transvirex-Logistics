import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Button,
  Alert,
  Modal,
  Form,
  Badge,
  Spinner,
} from "react-bootstrap";
import { getCurrentRole } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkerRole = "driver" | "dispatcher";

interface Worker {
  id: string;
  email: string;
  role: WorkerRole;
  hubId: string | null;
}

interface Hub {
  id: string;
  name: string;
  location: string;
  createdAt: string;
}

// ─── Mock API helpers (replace with real api calls) ───────────────────────────

// Replace these with your actual API service calls, e.g.:
//   import { getHubs, createHub, getWorkers, assignWorkerToHub } from "../services/api";

async function apiGetHubs(): Promise<Hub[]> {
  // TODO: replace with real API call
  return JSON.parse(localStorage.getItem("hubs") || "[]");
}

async function apiCreateHub(name: string, location: string): Promise<Hub> {
  // TODO: replace with real API call
  const hub: Hub = {
    id: crypto.randomUUID(),
    name,
    location,
    createdAt: new Date().toISOString(),
  };
  const hubs = JSON.parse(localStorage.getItem("hubs") || "[]");
  hubs.push(hub);
  localStorage.setItem("hubs", JSON.stringify(hubs));
  return hub;
}

async function apiDeleteHub(hubId: string): Promise<void> {
  // TODO: replace with real API call
  const hubs: Hub[] = JSON.parse(localStorage.getItem("hubs") || "[]");
  localStorage.setItem(
    "hubs",
    JSON.stringify(hubs.filter((h) => h.id !== hubId)),
  );
  // Unassign workers from deleted hub
  const workers: Worker[] = JSON.parse(localStorage.getItem("workers") || "[]");
  localStorage.setItem(
    "workers",
    JSON.stringify(
      workers.map((w) => (w.hubId === hubId ? { ...w, hubId: null } : w)),
    ),
  );
}

async function apiGetWorkers(): Promise<Worker[]> {
  // TODO: replace with real API call
  // In production this would return only driver/dispatcher accounts from your backend
  return JSON.parse(localStorage.getItem("workers") || "[]");
}

async function apiCreateWorker(
  email: string,
  password: string,
  role: WorkerRole,
  hubId: string,
): Promise<Worker> {
  // TODO: replace with real API call (also calls register endpoint)
  const worker: Worker = {
    id: crypto.randomUUID(),
    email,
    role,
    hubId,
  };
  const workers = JSON.parse(localStorage.getItem("workers") || "[]");
  workers.push(worker);
  localStorage.setItem("workers", JSON.stringify(workers));
  return worker;
}

async function apiAssignWorker(
  workerId: string,
  hubId: string | null,
): Promise<void> {
  // TODO: replace with real API call
  const workers: Worker[] = JSON.parse(localStorage.getItem("workers") || "[]");
  localStorage.setItem(
    "workers",
    JSON.stringify(
      workers.map((w) => (w.id === workerId ? { ...w, hubId } : w)),
    ),
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: WorkerRole }) {
  return (
    <Badge
      bg={role === "driver" ? "success" : "info"}
      className="text-capitalize"
    >
      {role}
    </Badge>
  );
}

function HubCard({
  hub,
  workers,
  onAddWorker,
  onAssign,
  onDeleteHub,
}: {
  hub: Hub;
  workers: Worker[];
  onAddWorker: (hub: Hub) => void;
  onAssign: (worker: Worker) => void;
  onDeleteHub: (hub: Hub) => void;
}) {
  const hubWorkers = workers.filter((w) => w.hubId === hub.id);
  const unassigned = workers.filter((w) => w.hubId === null);

  return (
    <div className="lh-hub-card">
      <div className="lh-hub-card__header">
        <div>
          <h5 className="lh-hub-card__name">{hub.name}</h5>
          <span className="lh-hub-card__location">
            <i className="bi bi-geo-alt me-1" />
            {hub.location}
          </span>
        </div>
        <div className="lh-hub-card__actions">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => onAddWorker(hub)}
            title="Add worker to hub"
          >
            <i className="bi bi-person-plus me-1" />
            Add Worker
          </Button>
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => onDeleteHub(hub)}
            title="Delete hub"
          >
            <i className="bi bi-trash" />
          </Button>
        </div>
      </div>

      {/* Workers list */}
      <div className="lh-hub-card__workers">
        {hubWorkers.length === 0 ? (
          <p className="lh-hub-card__empty">No workers assigned yet.</p>
        ) : (
          hubWorkers.map((w) => (
            <div key={w.id} className="lh-worker-row">
              <i className="bi bi-person-circle lh-worker-row__icon" />
              <span className="lh-worker-row__email">{w.email}</span>
              <RoleBadge role={w.role} />
              <Button
                size="sm"
                variant="ghost"
                className="lh-worker-row__unassign ms-auto"
                onClick={() => onAssign(w)}
                title="Move to another hub"
              >
                <i className="bi bi-arrow-left-right" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Quick-assign unassigned workers */}
      {unassigned.length > 0 && (
        <div className="lh-hub-card__pool">
          <p className="lh-hub-card__pool-label">Assign unassigned worker:</p>
          <div className="lh-hub-card__pool-list">
            {unassigned.map((w) => (
              <button
                key={w.id}
                className="lh-pool-chip"
                onClick={() =>
                  apiAssignWorker(w.id, hub.id).then(() => onAssign(w))
                }
                title={`Assign ${w.email} to ${hub.name}`}
              >
                <RoleBadge role={w.role} />
                <span>{w.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="lh-hub-card__footer">
        <small className="text-muted">
          Created {new Date(hub.createdAt).toLocaleDateString()}
        </small>
        <small className="text-muted">
          {hubWorkers.length} worker{hubWorkers.length !== 1 ? "s" : ""}
        </small>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function LogisticsHub() {
  const navigate = useNavigate();
  const currentRole = getCurrentRole();

  // ── State ──
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Create hub modal
  const [showHubModal, setShowHubModal] = useState(false);
  const [hubName, setHubName] = useState("");
  const [hubLocation, setHubLocation] = useState("");
  const [hubSaving, setHubSaving] = useState(false);
  const [hubError, setHubError] = useState<string | null>(null);

  // Add worker modal
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [targetHub, setTargetHub] = useState<Hub | null>(null);
  const [workerEmail, setWorkerEmail] = useState("");
  const [workerPassword, setWorkerPassword] = useState("");
  const [workerRole, setWorkerRole] = useState<WorkerRole>("driver");
  const [workerSaving, setWorkerSaving] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);

  // Assign worker modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignWorker, setAssignWorker] = useState<Worker | null>(null);
  const [assignTarget, setAssignTarget] = useState<string>("");
  const [assignSaving, setAssignSaving] = useState(false);

  // Delete hub confirm
  const [deleteHub, setDeleteHub] = useState<Hub | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  // ── Access guard ──
  if (currentRole !== "manager") {
    return (
      <Container
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="text-center">
          <h4 className="mb-3">Access Denied</h4>
          <p className="text-muted mb-4">
            Only managers can access Logistics Hub.
          </p>
          <Button variant="primary" onClick={() => navigate("/home")}>
            Back to Dashboard
          </Button>
        </div>
      </Container>
    );
  }

  // ── Load data ──
  useEffect(() => {
    (async () => {
      try {
        const [h, w] = await Promise.all([apiGetHubs(), apiGetWorkers()]);
        setHubs(h);
        setWorkers(w);
      } catch {
        setGlobalError("Failed to load hub data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Helpers ──
  function refresh() {
    Promise.all([apiGetHubs(), apiGetWorkers()]).then(([h, w]) => {
      setHubs(h);
      setWorkers(w);
    });
  }

  // Create hub
  async function handleCreateHub() {
    if (!hubName.trim() || !hubLocation.trim()) {
      setHubError("Please fill in both fields.");
      return;
    }
    setHubSaving(true);
    setHubError(null);
    try {
      await apiCreateHub(hubName.trim(), hubLocation.trim());
      setShowHubModal(false);
      setHubName("");
      setHubLocation("");
      refresh();
    } catch (err: any) {
      setHubError(err?.message ?? "Failed to create hub.");
    } finally {
      setHubSaving(false);
    }
  }

  // Add worker to hub
  function openWorkerModal(hub: Hub) {
    setTargetHub(hub);
    setWorkerEmail("");
    setWorkerPassword("");
    setWorkerRole("driver");
    setWorkerError(null);
    setShowWorkerModal(true);
  }

  async function handleCreateWorker() {
    if (!workerEmail.trim() || !workerPassword.trim()) {
      setWorkerError("Please fill in all fields.");
      return;
    }
    if (!targetHub) return;
    setWorkerSaving(true);
    setWorkerError(null);
    try {
      await apiCreateWorker(
        workerEmail.trim(),
        workerPassword,
        workerRole,
        targetHub.id,
      );
      setShowWorkerModal(false);
      refresh();
    } catch (err: any) {
      setWorkerError(err?.message ?? "Failed to create worker.");
    } finally {
      setWorkerSaving(false);
    }
  }

  // Assign / move worker
  function openAssignModal(worker: Worker) {
    setAssignWorker(worker);
    setAssignTarget(worker.hubId ?? "");
    setShowAssignModal(true);
  }

  async function handleAssign() {
    if (!assignWorker) return;
    setAssignSaving(true);
    try {
      await apiAssignWorker(assignWorker.id, assignTarget || null);
      setShowAssignModal(false);
      refresh();
    } finally {
      setAssignSaving(false);
    }
  }

  // Delete hub
  async function handleDeleteHub() {
    if (!deleteHub) return;
    setDeleteConfirming(true);
    try {
      await apiDeleteHub(deleteHub.id);
      setDeleteHub(null);
      refresh();
    } finally {
      setDeleteConfirming(false);
    }
  }

  // ── Render ──
  const unassignedWorkers = workers.filter((w) => w.hubId === null);

  return (
    <>
      <style>{`
        .lh-page {
          min-height: 100vh;
          background-color: var(--bg-color, #f8f9fa);
          padding: 40px 24px 80px;
          font-family: 'Poppins', sans-serif;
        }

        .lh-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 36px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .lh-topbar__left h1 {
          font-size: 26px;
          font-weight: 700;
          margin: 0;
          color: var(--font-color, #111);
        }

        .lh-topbar__left p {
          font-size: 14px;
          color: color-mix(in srgb, var(--font-color, #555) 65%, transparent);
          margin: 4px 0 0;
        }

        .lh-topbar__actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* Hub grid */
        .lh-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }

        .lh-hub-card {
          background: var(--card-bg, #fff);
          border: 1.5px solid var(--border-color, #dee2e6);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: box-shadow 0.15s;
        }

        .lh-hub-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .lh-hub-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .lh-hub-card__name {
          font-size: 17px;
          font-weight: 600;
          margin: 0 0 2px;
          color: var(--font-color, #111);
        }

        .lh-hub-card__location {
          font-size: 13px;
          color: color-mix(in srgb, var(--font-color, #555) 60%, transparent);
        }

        .lh-hub-card__actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .lh-hub-card__workers {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 36px;
        }

        .lh-hub-card__empty {
          font-size: 13px;
          color: color-mix(in srgb, var(--font-color, #888) 50%, transparent);
          margin: 0;
          font-style: italic;
        }

        .lh-worker-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--font-color, #000) 4%, transparent);
          font-size: 13px;
        }

        .lh-worker-row__icon {
          font-size: 16px;
          color: color-mix(in srgb, var(--font-color, #555) 50%, transparent);
        }

        .lh-worker-row__email {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--font-color, #333);
        }

        .lh-worker-row__unassign {
          background: none !important;
          border: none !important;
          padding: 2px 6px !important;
          color: color-mix(in srgb, var(--font-color, #777) 55%, transparent) !important;
          font-size: 15px;
          line-height: 1;
          cursor: pointer;
          border-radius: 4px !important;
          transition: color 0.15s !important;
        }

        .lh-worker-row__unassign:hover {
          color: var(--main-color, #0d6efd) !important;
          background: color-mix(in srgb, var(--main-color, #0d6efd) 10%, transparent) !important;
        }

        .lh-hub-card__pool {
          border-top: 1px dashed color-mix(in srgb, var(--font-color, #ccc) 25%, transparent);
          padding-top: 10px;
        }

        .lh-hub-card__pool-label {
          font-size: 12px;
          font-weight: 500;
          color: color-mix(in srgb, var(--font-color, #777) 60%, transparent);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .lh-hub-card__pool-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .lh-pool-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1.5px solid color-mix(in srgb, var(--main-color, #0d6efd) 40%, transparent);
          background: color-mix(in srgb, var(--main-color, #0d6efd) 7%, transparent);
          font-size: 12px;
          color: var(--main-color, #0d6efd);
          cursor: pointer;
          transition: background 0.15s;
        }

        .lh-pool-chip:hover {
          background: color-mix(in srgb, var(--main-color, #0d6efd) 15%, transparent);
        }

        .lh-hub-card__footer {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid color-mix(in srgb, var(--font-color, #ccc) 12%, transparent);
          padding-top: 10px;
        }

        /* Unassigned pool sidebar */
        .lh-pool-section {
          margin-top: 36px;
          padding: 20px;
          border: 1.5px dashed color-mix(in srgb, var(--font-color, #ccc) 30%, transparent);
          border-radius: 12px;
        }

        .lh-pool-section h6 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 12px;
          color: var(--font-color, #111);
        }

        .lh-pool-section__list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* Empty state */
        .lh-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: color-mix(in srgb, var(--font-color, #888) 55%, transparent);
        }

        .lh-empty i {
          font-size: 42px;
          display: block;
          margin-bottom: 12px;
        }

        .lh-empty p {
          font-size: 15px;
          margin: 0;
        }
      `}</style>

      <div className="lh-page">
        <Container fluid style={{ maxWidth: 1100 }}>
          {/* Top bar */}
          <div className="lh-topbar">
            <div className="lh-topbar__left">
              <h1>
                <i
                  className="bi bi-diagram-3 me-2"
                  style={{ color: "var(--main-color, #0d6efd)" }}
                />
                Logistics Hubs
              </h1>
              <p>
                Create and manage hubs, assign drivers and dispatchers to
                locations.
              </p>
            </div>
            <div className="lh-topbar__actions">
              <Button
                variant="outline-secondary"
                onClick={() => navigate("/home")}
              >
                <i className="bi bi-arrow-left me-1" /> Dashboard
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setHubName("");
                  setHubLocation("");
                  setHubError(null);
                  setShowHubModal(true);
                }}
              >
                <i className="bi bi-plus-lg me-1" /> New Hub
              </Button>
            </div>
          </div>

          {/* Global error */}
          {globalError && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setGlobalError(null)}
            >
              {globalError}
            </Alert>
          )}

          {/* Loading */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              {/* Hub grid */}
              <div className="lh-grid">
                {hubs.length === 0 ? (
                  <div className="lh-empty">
                    <i className="bi bi-building" />
                    <p>No hubs yet. Create your first hub to get started.</p>
                  </div>
                ) : (
                  hubs.map((hub) => (
                    <HubCard
                      key={hub.id}
                      hub={hub}
                      workers={workers}
                      onAddWorker={openWorkerModal}
                      onAssign={openAssignModal}
                      onDeleteHub={setDeleteHub}
                    />
                  ))
                )}
              </div>

              {/* Unassigned workers pool */}
              {unassignedWorkers.length > 0 && (
                <div className="lh-pool-section">
                  <h6>
                    <i className="bi bi-person-dash me-2 text-warning" />
                    Unassigned Workers ({unassignedWorkers.length})
                  </h6>
                  <div className="lh-pool-section__list">
                    {unassignedWorkers.map((w) => (
                      <button
                        key={w.id}
                        className="lh-pool-chip"
                        onClick={() => openAssignModal(w)}
                      >
                        <RoleBadge role={w.role} />
                        <span>{w.email}</span>
                        <i className="bi bi-arrow-right-circle" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Container>
      </div>

      {/* ── Create Hub Modal ── */}
      <Modal show={showHubModal} onHide={() => setShowHubModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Hub</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {hubError && <Alert variant="danger">{hubError}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Hub Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. North Depot"
              value={hubName}
              onChange={(e) => setHubName(e.target.value)}
              disabled={hubSaving}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Location</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Chicago, IL"
              value={hubLocation}
              onChange={(e) => setHubLocation(e.target.value)}
              disabled={hubSaving}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowHubModal(false)}
            disabled={hubSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateHub}
            disabled={hubSaving}
          >
            {hubSaving ? (
              <Spinner size="sm" animation="border" className="me-1" />
            ) : null}
            Create Hub
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Add Worker to Hub Modal ── */}
      <Modal
        show={showWorkerModal}
        onHide={() => setShowWorkerModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Add Worker to <strong>{targetHub?.name}</strong>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {workerError && <Alert variant="danger">{workerError}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="worker@example.com"
              value={workerEmail}
              onChange={(e) => setWorkerEmail(e.target.value)}
              disabled={workerSaving}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Set a password"
              value={workerPassword}
              onChange={(e) => setWorkerPassword(e.target.value)}
              disabled={workerSaving}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Role</Form.Label>
            <Form.Select
              value={workerRole}
              onChange={(e) => setWorkerRole(e.target.value as WorkerRole)}
              disabled={workerSaving}
            >
              <option value="driver">Driver</option>
              <option value="dispatcher">Dispatcher</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowWorkerModal(false)}
            disabled={workerSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateWorker}
            disabled={workerSaving}
          >
            {workerSaving ? (
              <Spinner size="sm" animation="border" className="me-1" />
            ) : null}
            Create &amp; Assign
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Assign / Move Worker Modal ── */}
      <Modal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Move Worker</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            Reassign <strong>{assignWorker?.email}</strong> to a different hub:
          </p>
          <Form.Select
            value={assignTarget}
            onChange={(e) => setAssignTarget(e.target.value)}
            disabled={assignSaving}
          >
            <option value="">— Unassigned —</option>
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.location})
              </option>
            ))}
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAssignModal(false)}
            disabled={assignSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={assignSaving}
          >
            {assignSaving ? (
              <Spinner size="sm" animation="border" className="me-1" />
            ) : null}
            Save Assignment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Delete Hub Confirm Modal ── */}
      <Modal show={!!deleteHub} onHide={() => setDeleteHub(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Hub</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete <strong>{deleteHub?.name}</strong>?
            All workers currently assigned to this hub will become unassigned.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteHub(null)}
            disabled={deleteConfirming}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteHub}
            disabled={deleteConfirming}
          >
            {deleteConfirming ? (
              <Spinner size="sm" animation="border" className="me-1" />
            ) : null}
            Delete Hub
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default LogisticsHub;
