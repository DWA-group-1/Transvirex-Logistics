import { useState } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/register";
import ChangePassword from "./pages/ChangePassword";
import TrackInvoices from "./pages/TrackInvoices";
import TrackOrders from "./pages/TrackOrders";
import PlanRoutes from "./pages/PlanRoutes";
import ProtectedRoute from "./components/ProtectedRoute";
import Customers from "./pages/Customers.tsx";
import Hubs from "./pages/Hubs.tsx";
import Incidents from "./pages/Incidents.tsx";
import AiAgent from "./pages/AiAgent.tsx";
import Reports from "./pages/Reports.tsx";
import NotFound from "./pages/NotFound.tsx";

import "./App.css";

function ProtectedLayout({
  isDark,
  onToggleTheme,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <ProtectedRoute>
      <Navbar isDark={isDark} onToggleTheme={onToggleTheme} />
      <Outlet />
    </ProtectedRoute>
  );
}

function App() {
  const [isDark, setIsDark] = useState(false);

  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light",
  );
  document.documentElement.setAttribute(
    "data-bs-theme",
    isDark ? "dark" : "light",
  );

  const toggleTheme = () => setIsDark((p) => !p);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        <Route path="/change-password" element={<ChangePassword />} />

        <Route
          element={
            <ProtectedLayout isDark={isDark} onToggleTheme={toggleTheme} />
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/ai-agent" element={<AiAgent />} />
          <Route
            path="/track-orders"
            element={
              <ProtectedRoute allowedRoles={["dispatcher", "manager"]}>
                <TrackOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track-invoices"
            element={
              <ProtectedRoute allowedRoles={["billing", "manager"]}>
                <TrackInvoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan-routes"
            element={
              <ProtectedRoute allowedRoles={["driver", "manager"]}>
                <PlanRoutes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <Register />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={["manager", "dispatcher"]}>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hubs"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <Hubs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents"
            element={
              <ProtectedRoute allowedRoles={["manager", "dispatcher"]}>
                <Incidents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["manager", "dispatcher"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
