import React, { useContext } from 'react';
import { ThemeContext } from '../../App'; // Get the context

const Display = () => {
    // Get the state and setter from the global context
    const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);

    const handleToggle = () => {
        setIsDarkMode(prev => !prev);
        // If you were using a backend, you would call your API here:
        // axios.put('/api/settings', { dark_mode: !isDarkMode });
    };

    return (
        <div className="settings-page">
            <h2>Display Settings</h2>
            
            <div className="content-card display-settings-card">
                <div className="setting-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <label style={{fontWeight: 'bold'}}>Dark Mode</label>
                        <p className="text-muted-color" style={{fontSize: '0.9em', margin: 0}}>Toggle the application theme between light and dark mode.</p>
                    </div>
                    {/* Theme Toggle Button */}
                    <button 
                        className="btn-primary" 
                        onClick={handleToggle}
                        style={{ width: '100px', backgroundColor: isDarkMode ? 'var(--primary-hover-color)' : 'var(--primary-color)' }}
                    >
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Display;