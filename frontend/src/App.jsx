import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Expenses from "./pages/Expenses";
import Payments from "./pages/Payments";
import SettingsIndex from "./pages/settings/SettingsIndex";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div className="content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/payments/:service" element={<Payments />} />
              <Route path="/settings/*" element={<SettingsIndex />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
