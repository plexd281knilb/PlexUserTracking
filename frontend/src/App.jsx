import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Expenses from "./pages/Expenses";
import Payments from "./pages/Payments";
import SettingsIndex from "./pages/settings/SettingsIndex";
import Venmo from "./pages/payments/Venmo";
import Zelle from "./pages/payments/Zelle";
import Paypal from "./pages/payments/Paypal";
import Tautulli from "./pages/settings/Tautulli";
import Display from "./pages/settings/Display";
import Notifications from "./pages/settings/Notifications";
import ScanSettings from "./pages/settings/Scan";
import System from "./pages/settings/System";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminLogin from "./pages/admin/AdminLogin";
import Login from "./pages/Login";

export default function App(){
  return (
    <BrowserRouter>
      <div className="app-root">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div className="content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/admin/setup" element={<AdminSetup />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/payments/venmo" element={<Venmo />} />
              <Route path="/payments/zelle" element={<Zelle />} />
              <Route path="/payments/paypal" element={<Paypal />} />
              <Route path="/settings" element={<SettingsIndex />} />
              <Route path="/settings/tautulli" element={<Tautulli />} />
              <Route path="/settings/display" element={<Display />} />
              <Route path="/settings/notifications" element={<Notifications />} />
              <Route path="/settings/scan" element={<ScanSettings />} />
              <Route path="/settings/system" element={<System />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
