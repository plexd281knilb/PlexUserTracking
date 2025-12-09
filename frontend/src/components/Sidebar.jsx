// frontend/src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
      <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>Users</NavLink>
      
      <div className="payments-section">
        <span>Payments</span>
        <NavLink to="/payments/paypal" className={({ isActive }) => isActive ? 'active' : ''}>PayPal</NavLink>
        <NavLink to="/payments/venmo" className={({ isActive }) => isActive ? 'active' : ''}>Venmo</NavLink>
        <NavLink to="/payments/zelle" className={({ isActive }) => isActive ? 'active' : ''}>Zelle</NavLink>
      </div>

      <NavLink to="/expenses" className={({ isActive }) => isActive ? 'active' : ''}>Expenses</NavLink>
      <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>Settings</NavLink>

      <div className="admin-section">
        <span>Admin</span>
        <NavLink to="/admin/setup" className={({ isActive }) => isActive ? 'active' : ''}>Setup</NavLink>
        <NavLink to="/admin/login" className={({ isActive }) => isActive ? 'active' : ''}>Login</NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
