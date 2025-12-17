import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Users from './pages/Users';
import Settings from './pages/Settings';
import './App.css';

export const ThemeContext = createContext();

function App() {
    // Load theme from localStorage or default to true (Dark Mode)
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
                <div className="app-container">
                    <nav className="sidebar">
                        <div className="brand">PLEX TRACKER</div>
                        <div className="nav-links">
                            <NavLink to="/users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                👥 Users
                            </NavLink>
                            <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                ⚙️ Settings
                            </NavLink>
                        </div>
                        
                        <div style={{ marginTop: 'auto', padding: '20px' }}>
                            <button 
                                className="button" 
                                style={{ width: '100%', fontSize: '0.8rem', backgroundColor: 'var(--bg-card)' }}
                                onClick={() => setIsDarkMode(!isDarkMode)}
                            >
                                {isDarkMode ? '☀️ Light Mode' : '🌑 Dark Mode'}
                            </button>
                        </div>
                    </nav>

                    <main className="content">
                        <Routes>
                            <Route path="/" element={<Users />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </ThemeContext.Provider>
    );
}

export default App;