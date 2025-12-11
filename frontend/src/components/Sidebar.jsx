import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="sidebar-header">
        PLEX TRACKER
      </h2>

      <div className="sidebar-nav">

        <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">🏠</span> Dashboard
        </NavLink>

        <NavLink to="/users" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">👥</span> Users
        </NavLink>

        <div className="menu-section">PAYMENTS</div>
        
        <NavLink to="/payments/venmo" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">💳</span> Venmo
        </NavLink>

        <NavLink to="/payments/zelle" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">💳</span> Zelle
        </NavLink>

        <NavLink to="/payments/paypal" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">💳</span> PayPal
        </NavLink>

        <div className="menu-section">MANAGEMENT</div>

        <NavLink to="/expenses" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">💰</span> Expenses
        </NavLink>

        <NavLink to="/settings/display" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">⚙️</span> Settings
        </NavLink>

        <div className="menu-section">ADMIN</div>

        <NavLink to="/admin/setup" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">🛠️</span> Setup
        </NavLink>

        <NavLink to="/admin/login" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">🔑</span> Login
        </NavLink>

      </div>
    </div>
  );
}

export default Sidebar;