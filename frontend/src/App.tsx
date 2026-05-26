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
import "./App.css";

// Layout wrapper — renders Navbar once + child page below
function ProtectedLayout({ isDark, onToggleTheme }: { isDark: boolean; onToggleTheme: () => void }) {
  return (
    <ProtectedRoute>
      <Navbar isDark={isDark} onToggleTheme={onToggleTheme} />
      <Outlet />
    </ProtectedRoute>
  );
}

function App() {
  const [isDark, setIsDark] = useState(false);

  // Apply theme globally — must be on <html> so Bootstrap portals (Offcanvas) inherit it
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  document.documentElement.setAttribute("data-bs-theme", isDark ? "dark" : "light");

  const toggleTheme = () => setIsDark((p) => !p);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Protected — Navbar rendered once via layout */}
        <Route element={<ProtectedLayout isDark={isDark} onToggleTheme={toggleTheme} />}>
          <Route path="/home"           element={<Home />} />
          <Route path="/track-orders"   element={<TrackOrders />} />
          <Route path="/track-invoices" element={<TrackInvoices />} />
          <Route path="/plan-routes"    element={<PlanRoutes />} />
        </Route>

        {/* Manager-only — no Navbar needed on register */}
        <Route
          path="/register"
          element={
            <ProtectedRoute requireManager>
              <Register />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;