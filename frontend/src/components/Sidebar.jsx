import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css"; // Ensure this file exists and contains the base styles

function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="sidebar-header" style={{fontSize: '1.2rem', padding: '0 10px', marginBottom: '20px', color: 'var(--accent)'}}>
        PLEX TRACKER
      </h2>

      <ul className="sidebar-nav">

        <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">🏠</span> Dashboard
        </NavLink>

        <NavLink to="/users" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">👥</span> Users
        </NavLink>

        <li className="menu-section">PAYMENTS</li>
        
        <NavLink to="/payments/venmo" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">💳</span> Venmo
        </NavLink>

        <NavLink to="/payments/zelle" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">💳</span> Zelle
        </NavLink>

        <NavLink to="/payments/paypal" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">💳</span> PayPal
        </NavLink>

        <li className="menu-section">MANAGEMENT</li>

        <NavLink to="/expenses" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">💰</span> Expenses
        </NavLink>

        <NavLink to="/settings/display" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">⚙️</span> Settings
        </NavLink>

        <li className="menu-section">ADMIN</li>

        <NavLink to="/admin/setup" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">🛠️</span> Setup
        </NavLink>

        <NavLink to="/admin/login" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="icon">🔑</span> Login
        </NavLink>

      </ul>
    </div>
  );
}

export default Sidebar;