import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">PLEX TRACKER</div>

      <div className="sidebar-section">DASHBOARD</div>
      <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="icon">📊</span> Overview
      </NavLink>
      <NavLink to="/users" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="icon">👥</span> Users
      </NavLink>

      <div className="sidebar-section">PAYMENTS</div>
      <NavLink to="/payments/venmo" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="icon">🔵</span> Venmo
      </NavLink>
      <NavLink to="/payments/zelle" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="icon">🟣</span> Zelle
      </NavLink>
      <NavLink to="/payments/paypal" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="icon">💳</span> PayPal
      </NavLink>

      <div className="sidebar-section">SYSTEM</div>
      <NavLink to="/expenses" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="icon">💰</span> Expenses
      </NavLink>
      <NavLink to="/settings/display" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="icon">⚙️</span> Settings
      </NavLink>
      
      <div className="sidebar-section">ADMIN</div>
      <NavLink to="/admin/setup" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="icon">🛠️</span> Setup
      </NavLink>
      <NavLink to="/admin/login" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="icon">🔒</span> Login
      </NavLink>
    </div>
  );
}

export default Sidebar;