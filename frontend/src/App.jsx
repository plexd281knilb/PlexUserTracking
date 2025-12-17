import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Users from './pages/Users';
import Settings from './pages/Settings';
import './styles.css'; // FIXED: Pointing to your existing CSS file

export const ThemeContext = createContext();

function App() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('isDarkMode');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
        // You can add .light-mode styles to your styles.css later if needed
        document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
    }, [isDarkMode]);

    return (
        <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
            <Router>
                <div className="app-root"> {/* Matched to styles.css */}
                    <nav className="sidebar">
                        <h2>PLEX TRACKER</h2>
                        <div className="nav-group">
                            <NavLink to="/users" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                👥 Users
                            </NavLink>
                            <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                ⚙️ Settings
                            </NavLink>
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

                    <main className="main"> {/* Matched to styles.css */}
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