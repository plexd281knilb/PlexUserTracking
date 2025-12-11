import React, { useState, useEffect, createContext, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './styles.css';

import Sidebar from "./components/Sidebar";

// Note: Files were likely nested in pages/ and pages/admin/
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import PaymentsVenmo from "./pages/payments/Venmo"; 
import PaymentsZelle from "./pages/payments/Zelle";
import PaymentsPaypal from "./pages/payments/Paypal";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminLogin from "./pages/admin/AdminLogin";

// --- THEME CONTEXT DEFINITION (REQUIRED TO FIX CRASH) ---
export const ThemeContext = createContext();

function App() {
    // 1. Theme State Logic: Initialize dark mode state, reading from local storage
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode === 'dark'; 
    });
    
    // 2. Effect to apply the theme attribute and persist state
    useEffect(() => {
        const theme = isDarkMode ? 'dark' : 'light';
        localStorage.setItem('themeMode', theme);
        // Apply data-theme attribute to the body to match your CSS logic
        document.body.setAttribute('data-theme', theme);
    }, [isDarkMode]);

    const themeContextValue = useMemo(() => ({
        isDarkMode,
        setIsDarkMode
    }), [isDarkMode]);

    return (
        // 3. Wrap the app with the ThemeContext Provider
        <ThemeContext.Provider value={themeContextValue}>
            <Router>
                <div className="app-root"> 
                    <Sidebar />
                    <div className="main">
                        <div className="content">
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/users" element={<Users />} />
                                {/* Update routes to point to the nested payment pages */}
                                <Route path="/payments/venmo" element={<PaymentsVenmo />} />
                                <Route path="/payments/zelle" element={<PaymentsZelle />} />
                                <Route path="/payments/paypal" element={<PaymentsPaypal />} />
                                <Route path="/expenses" element={<Expenses />} />
                                <Route path="/settings/*" element={<Settings />} /> {/* Use /* for nested settings routes */}
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