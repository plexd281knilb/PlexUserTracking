import React, { useState, useEffect, createContext, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './styles.css';

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import PaymentsVenmo from "./pages/payments/Venmo"; 
import PaymentsZelle from "./pages/payments/Zelle";
import PaymentsPaypal from "./pages/payments/Paypal";
import AdminSetup from "./pages/admin/AdminSetup"; 
import AdminLogin from "./pages/admin/AdminLogin"; 

export const ThemeContext = createContext();

function App() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        // DEFAULT TO DARK MODE if nothing is saved
        return savedMode !== null ? savedMode === 'dark' : true;
    });
    
    useEffect(() => {
        const theme = isDarkMode ? 'dark' : 'light';
        localStorage.setItem('themeMode', theme);
        document.body.setAttribute('data-theme', theme);
    }, [isDarkMode]);

    const themeContextValue = useMemo(() => ({
        isDarkMode,
        setIsDarkMode
    }), [isDarkMode]);

    return (
        <ThemeContext.Provider value={themeContextValue}>
            <Router>
                <div className="app-root"> 
                    <Sidebar />
                    <div className="main">
                        <div className="content">
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/users" element={<Users />} />
                                <Route path="/payments/venmo" element={<PaymentsVenmo />} />
                                <Route path="/payments/zelle" element={<PaymentsZelle />} />
                                <Route path="/payments/paypal" element={<PaymentsPaypal />} />
                                <Route path="/expenses" element={<Expenses />} />
                                <Route path="/settings/*" element={<Settings />} /> 
                                <Route path="/admin/setup" element={<AdminSetup />} />
                                <Route path="/admin/login" element={<AdminLogin />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                    </div>
                </div>
            </Router>
        </ThemeContext.Provider>
    );
}

export default App;