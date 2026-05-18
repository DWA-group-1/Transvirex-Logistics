import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/login";
import TrackInvoices from "./pages/TrackInvoices";
import TrackOrders from "./pages/TrackOrders";
import PlanRoutes from "./pages/PlanRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <>
              <Navbar />
              <Home />
            </>
          }
        />
        <Route
          path="/track-orders"
          element={
            <>
              <Navbar />
              <TrackOrders />
            </>
          }
        />
        <Route
          path="/track-invoices"
          element={
            <>
              <Navbar />
              <TrackInvoices />
            </>
          }
        />
        <Route
          path="/plan-routes"
          element={
            <>
              <Navbar />
              <PlanRoutes />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
