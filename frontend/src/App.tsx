import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/register";
import TrackInvoices from "./pages/TrackInvoices";
import TrackOrders from "./pages/TrackOrders";
import PlanRoutes from "./pages/PlanRoutes";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Protected — any authenticated user */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Navbar />
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/track-orders"
          element={
            <ProtectedRoute>
              <Navbar />
              <TrackOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/track-invoices"
          element={
            <ProtectedRoute>
              <Navbar />
              <TrackInvoices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan-routes"
          element={
            <ProtectedRoute>
              <Navbar />
              <PlanRoutes />
            </ProtectedRoute>
          }
        />

        {/* Manager-only */}
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
