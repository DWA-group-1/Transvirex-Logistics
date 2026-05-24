// ─── ProtectedRoute.tsx ─────────────────────────────────────────────────────
// Drop this file at: src/components/ProtectedRoute.tsx
//
// Redirects unauthenticated users to /login and blocks non-managers from /register.

import { Navigate } from "react-router-dom";
import { isAuthenticated, getCurrentRole } from "../services/api";

interface Props {
  children: React.ReactNode;
  requireManager?: boolean;
}

function ProtectedRoute({ children, requireManager = false }: Props) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (requireManager && getCurrentRole() !== "manager") {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
