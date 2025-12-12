import React, { useContext } from 'react';
import { ThemeContext } from '../../App'; 

const Display = () => {
    const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);

    return (
        <div className="card">
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3>Appearance</h3>
                    <p className="small" style={{ margin: 0, maxWidth: '400px' }}>
                        Toggle between the dark slate theme (recommended) and the light theme.
                    </p>
                </div>
                
                <button 
                    className="button" 
                    onClick={() => setIsDarkMode(prev => !prev)}
                    style={{
                        backgroundColor: isDarkMode ? 'var(--bg-app)' : 'var(--accent)',
                        color: isDarkMode ? 'var(--text-main)' : 'white',
                        border: '1px solid var(--border)'
                    }}
                >
                    {isDarkMode ? '☀️ Switch to Light Mode' : '🌑 Switch to Dark Mode'}
                </button>
            </div>
        </div>
    );
};

export default Display;