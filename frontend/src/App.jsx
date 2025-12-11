import React, { useState, useEffect, createContext, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import AdminLogin from './pages/AdminLogin';
import AdminSetup from './pages/AdminSetup';
// Import other pages/components as needed...

// Create Theme Context for sharing state
export const ThemeContext = createContext();

function App() {
    // Initialize dark mode state, reading from local storage
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode === 'true'; // Default to false if not found
    });
    
    // Effect to update local storage and apply the theme class to the body
    useEffect(() => {
        localStorage.setItem('darkMode', isDarkMode);
        // Apply the CSS class that triggers the variable overrides
        document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
    }, [isDarkMode]);

    // Memoize the context value to prevent unnecessary re-renders
    const themeContextValue = useMemo(() => ({
        isDarkMode,
        setIsDarkMode
    }), [isDarkMode]);

    return (
        // Wrap the entire app in the ThemeContext Provider
        <ThemeContext.Provider value={themeContextValue}>
            <Router>
                <div id="app-container">
                    <Sidebar />
                    <div id="main-content">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/expenses" element={<Expenses />} />
                            <Route path="/settings/*" element={<Settings />} /> 
                            <Route path="/payments/*" element={<Payments />} />
                            <Route path="/admin-login" element={<AdminLogin />} />
                            <Route path="/admin-setup" element={<AdminSetup />} />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </div>
                </div>
            </Router>
        </ThemeContext.Provider>
    );
}

export default App;