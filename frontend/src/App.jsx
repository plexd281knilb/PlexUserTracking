import React, { useState, useEffect, createContext, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './styles.css'; // Ensure your styles are loaded

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import PaymentsVenmo from "./pages/PaymentsVenmo";
import PaymentsZelle from "./pages/PaymentsZelle";
import PaymentsPaypal from "./pages/PaymentsPaypal";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import AdminSetup from "./pages/AdminSetup";
import AdminLogin from "./pages/AdminLogin";

// --- THEME CONTEXT DEFINITION (REQUIRED TO FIX CRASH) ---
export const ThemeContext = createContext();

function App() {
    // 1. Theme State Logic: Initialize dark mode state, reading from local storage
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Read "false" as false, "true" as true, and default to false if not found
        const savedMode = localStorage.getItem('darkMode');
        return savedMode === 'true'; 
    });
    
    // 2. Effect to apply the theme class and persist state
    useEffect(() => {
        localStorage.setItem('darkMode', isDarkMode);
        document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
    }, [isDarkMode]);

    // Memoize the context value
    const themeContextValue = useMemo(() => ({
        isDarkMode,
        setIsDarkMode
    }), [isDarkMode]);
    // --------------------------------------------------------

    return (
        // 3. Wrap the app with the ThemeContext Provider
        <ThemeContext.Provider value={themeContextValue}>
            <Router>
                <div id="app-container"> {/* Use the ID defined in styles.css */}
                    <Sidebar />
                    <div id="main-content"> {/* Use the ID defined in styles.css */}
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/payments/venmo" element={<PaymentsVenmo />} />
                            <Route path="/payments/zelle" element={<PaymentsZelle />} />
                            <Route path="/payments/paypal" element={<PaymentsPaypal />} />
                            <Route path="/expenses" element={<Expenses />} />
                            <Route path="/settings/*" element={<Settings />} /> {/* Use /* for nested settings routes */}
                            <Route path="/admin/setup" element={<AdminSetup />} />
                            <Route path="/admin/login" element={<AdminLogin />} />
                            {/* Fallback route if none match */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </div>
            </Router>
        </ThemeContext.Provider>
    );
}

export default App;