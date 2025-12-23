import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Components
import Sidebar from './components/Sidebar';

// Main Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Upcoming from './pages/Upcoming';
import Expenses from './pages/Expenses';

// Payment Pages (UPDATED PORTS)
import Venmo from './pages/payments/Venmo'; 
import Zelle from './pages/payments/Zelle';
import Paypal from './pages/payments/Paypal';

// Email Pages
import MonthlyEmails from './pages/emails/MonthlyEmails';
import YearlyEmails from './pages/emails/YearlyEmails';
import PaymentReceipts from './pages/emails/PaymentReceipts';

import './styles.css';

function App() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <Router>
            <div className="app-root">
                <Sidebar theme={theme} toggleTheme={toggleTheme} />
                
                <div className="main">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/upcoming" element={<Upcoming />} />
                        
                        <Route path="/venmo" element={<Venmo />} />
                        <Route path="/zelle" element={<Zelle />} />
                        <Route path="/paypal" element={<Paypal />} />
                        
                        <Route path="/emails/monthly" element={<MonthlyEmails />} />
                        <Route path="/emails/yearly" element={<YearlyEmails />} />
                        <Route path="/emails/receipts" element={<PaymentReceipts />} />
                        
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/expenses" element={<Expenses />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;