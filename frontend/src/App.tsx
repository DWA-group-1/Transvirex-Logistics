import { useState } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/register";
import TrackInvoices from "./pages/TrackInvoices";
import TrackOrders from "./pages/TrackOrders";
import PlanRoutes from "./pages/PlanRoutes";
import ProtectedRoute from "./components/ProtectedRoute";
import LogisticsHub from "./pages/LogisticsHub";

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
        <Route
          path="/"
          element={<Login isDark={isDark} onToggleTheme={toggleTheme} />}
        />

        {/* Protected — Navbar rendered once via layout */}
        <Route
          element={
            <ProtectedLayout isDark={isDark} onToggleTheme={toggleTheme} />
          }
        >
          <Route path="/home" element={<Home />} />
          <Route
            path="/track-orders"
            element={
              <ProtectedRoute allowedRoles={["driver", "manager"]}>
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
              <ProtectedRoute allowedRoles={["dispatcher", "manager"]}>
                <PlanRoutes />
              </ProtectedRoute>
            }
          />
          <Route path="/logistics-hub" element={<LogisticsHub />} />
          <Route
            path="/register"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <Register />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
