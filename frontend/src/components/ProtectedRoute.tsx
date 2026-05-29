import { Navigate } from "react-router-dom";
import { isAuthenticated, getCurrentRole } from "../services/api";

type Role = "driver" | "dispatcher" | "billing" | "manager";

interface Props {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const role = getCurrentRole();

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
