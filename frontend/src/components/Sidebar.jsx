import React from "react";
import { Link } from "react-router-dom";
export default function Sidebar(){
  return (
    <div className="sidebar">
      <h3>PlexUserTracking</h3>
      <div className="nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/users">Users</Link>
        <Link to="/payments/venmo">Venmo</Link>
        <Link to="/payments/zelle">Zelle</Link>
        <Link to="/payments/paypal">PayPal</Link>
        <Link to="/expenses">Expenses</Link>
        <Link to="/settings">Settings</Link>
        <Link to="/admin/setup">Admin Setup</Link>
        <Link to="/admin/login">Admin Login</Link>
      </div>
    </div>
  );
}
