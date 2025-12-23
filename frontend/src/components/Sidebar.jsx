import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ theme, toggleTheme }) => {
    return (
        <div className="sidebar">
            <h2>PLEX TRACKER</h2>

            <div className="nav-group">
                <div className="nav-label">DASHBOARD</div>
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    📊 Overview
                </NavLink>
                <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    👥 Users
                </NavLink>
                <NavLink to="/upcoming" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    📅 All Upcoming
                </NavLink>
            </div>

            <div className="nav-group">
                <div className="nav-label">PAYMENTS</div>
                <NavLink to="/venmo" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    🔵 Venmo
                </NavLink>
                <NavLink to="/zelle" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    🟣 Zelle
                </NavLink>
                <NavLink to="/paypal" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    🟡 PayPal
                </NavLink>
            </div>

            <div className="nav-group">
                <div className="nav-label">EMAIL AUTOMATION</div>
                <NavLink to="/emails/monthly" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    📅 Monthly Reminders
                </NavLink>
                <NavLink to="/emails/yearly" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    📆 Yearly Reminders
                </NavLink>
                <NavLink to="/emails/receipts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    📄 Payment Receipts
                </NavLink>
            </div>

            <div className="nav-group">
                <div className="nav-label">SYSTEM</div>
                <NavLink to="/expenses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    💰 Expenses
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    ⚙️ Settings
                </NavLink>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <button 
                    onClick={toggleTheme} 
                    className="button" 
                    style={{ 
                        width: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '10px',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-main)'
                    }}
                >
                    {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;