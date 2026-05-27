import { Navigate } from "react-router-dom";
import { isAuthenticated, getCurrentRole } from "../services/api";

interface Props {
  children: React.ReactNode;
  requireManager?: boolean;
}

export default function ProtectedRoute({
  children,
  requireManager = false,
}: Props) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (requireManager && getCurrentRole() !== "manager") {
    // if the user isn't a manager you send them to 403 page unauthorized with a message.
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="text-center">
          <h4 className="mb-3">Access Denied</h4>
          <p className="text-muted mb-4">
            You do not have permission to view this page.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.history.back()}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
