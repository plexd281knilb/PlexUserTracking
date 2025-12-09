import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css'; // Make sure to create this file for styling

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">PlexUserTracking</h2>
      <nav>
        <ul>
          <li>
            <NavLink exact to="/" activeClassName="active">
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/users" activeClassName="active">
              Users
            </NavLink>
          </li>
          <li>
            <NavLink to="/payments/venmo" activeClassName="active">
              Venmo
            </NavLink>
          </li>
          <li>
            <NavLink to="/payments/zelle" activeClassName="active">
              Zelle
            </NavLink>
          </li>
          <li>
            <NavLink to="/payments/paypal" activeClassName="active">
              PayPal
            </NavLink>
          </li>
          <li>
            <NavLink to="/expenses" activeClassName="active">
              Expenses
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" activeClassName="active">
              Settings
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/setup" activeClassName="active">
              Admin Setup
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/login" activeClassName="active">
              Admin Login
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
