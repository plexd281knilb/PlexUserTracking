import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Plex User Tracking</h2>

      <ul className="sidebar-menu">

        <li>
          <NavLink to="/" end>Dashboard</NavLink>
        </li>

        <li>
          <NavLink to="/users">Users</NavLink>
        </li>

        <li className="menu-section">Payments</li>
        
        <li>
          <NavLink to="/payments/venmo">Venmo</NavLink>
        </li>

        <li>
          <NavLink to="/payments/zelle">Zelle</NavLink>
        </li>

        <li>
          <NavLink to="/payments/paypal">PayPal</NavLink> {/* ✅ FIXED */}
        </li>

        <li className="menu-section">Management</li>

        <li>
          <NavLink to="/expenses">Expenses</NavLink>
        </li>

        <li>
          <NavLink to="/settings">Settings</NavLink>
        </li>

        <li className="menu-section">Admin</li>

        <li>
          <NavLink to="/admin/setup">Admin Setup</NavLink>
        </li>

        <li>
          <NavLink to="/admin/login">Admin Login</NavLink>
        </li>

      </ul>
    </div>
  );
}

export default Sidebar;
