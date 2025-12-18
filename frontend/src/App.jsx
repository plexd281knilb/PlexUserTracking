import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';

// Pages
import Users from './pages/Users';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Upcoming from './pages/Upcoming';
import Venmo from './pages/payments/Venmo';
import Zelle from './pages/payments/Zelle';
import Paypal from './pages/payments/Paypal';

// New Email Pages
import MonthlyEmails from './pages/emails/MonthlyEmails';
import YearlyEmails from './pages/emails/YearlyEmails';
import PaymentReceipts from './pages/emails/PaymentReceipts';

import './styles.css';

export const ThemeContext = createContext();

function App() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('isDarkMode');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
        document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
    }, [isDarkMode]);

    return (
        <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
            <Router>
                <div className="app-root">
                    <nav className="sidebar">
                        <h2>PLEX TRACKER</h2>
                        
                        <div className="nav-group">
                            <div className="nav-label">DASHBOARD</div>
                            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>📊 Overview</NavLink>
                            <NavLink to="/users" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>👥 Users</NavLink>
                            <NavLink to="/upcoming" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>📅 Upcoming</NavLink>
                        </div>

                        <div className="nav-group">
                            <div className="nav-label">PAYMENTS</div>
                            <NavLink to="/payments/venmo" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>🔵 Venmo</NavLink>
                            <NavLink to="/payments/zelle" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>🟣 Zelle</NavLink>
                            <NavLink to="/payments/paypal" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>💳 PayPal</NavLink>
                        </div>

                        <div className="nav-group">
                            <div className="nav-label">EMAIL AUTOMATION</div>
                            <NavLink to="/emails/monthly" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>📅 Monthly Reminders</NavLink>
                            <NavLink to="/emails/yearly" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>📆 Yearly Reminders</NavLink>
                            <NavLink to="/emails/receipt" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>🧾 Payment Receipts</NavLink>
                        </div>

                        <div className="nav-group">
                            <div className="nav-label">SYSTEM</div>
                            <NavLink to="/expenses" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>💰 Expenses</NavLink>
                            <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>⚙️ Settings</NavLink>
                        </div>
                        
                        <div style={{ marginTop: 'auto' }}>
                            <button 
                                className="button" 
                                style={{ width: '100%', fontSize: '0.8rem', backgroundColor: 'var(--bg-card)' }}
                                onClick={() => setIsDarkMode(!isDarkMode)}
                            >
                                {isDarkMode ? '☀️ Light Mode' : '🌑 Dark Mode'}
                            </button>
                        </div>
                    </nav>

                    <main className="main">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/upcoming" element={<Upcoming />} />
                            
                            <Route path="/payments/venmo" element={<Venmo />} />
                            <Route path="/payments/zelle" element={<Zelle />} />
                            <Route path="/payments/paypal" element={<Paypal />} />
                            
                            <Route path="/emails/monthly" element={<MonthlyEmails />} />
                            <Route path="/emails/yearly" element={<YearlyEmails />} />
                            <Route path="/emails/receipt" element={<PaymentReceipts />} />
                            
                            <Route path="/expenses" element={<Expenses />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </ThemeContext.Provider>
    );
}

export default App;