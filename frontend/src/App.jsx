import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import PaymentsVenmo from "./pages/PaymentsVenmo";
import PaymentsZelle from "./pages/PaymentsZelle";
import PaymentsPaypal from "./pages/PaymentsPaypal";  // ✅ FIXED NAME
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import AdminSetup from "./pages/AdminSetup";
import AdminLogin from "./pages/AdminLogin";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/payments/venmo" element={<PaymentsVenmo />} />
            <Route path="/payments/zelle" element={<PaymentsZelle />} />
            <Route path="/payments/paypal" element={<PaymentsPaypal />} /> {/* ✅ FIXED */}
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin/setup" element={<AdminSetup />} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
