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
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
