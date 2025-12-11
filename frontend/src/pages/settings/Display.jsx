import React, { useContext } from 'react';
import { ThemeContext } from '../../App'; 

const Display = () => {
    const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);

    const handleToggle = () => {
        setIsDarkMode(prev => !prev);
    };

    return (
        <div className="card">
            <h3>Display Settings</h3>
            
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                    <label style={{ fontWeight: 'bold' }}>Dark Mode</label>
                    <p className="small" style={{ margin: 0 }}>Toggle the application theme.</p>
                </div>
                {/* Theme Toggle Button */}
                <button 
                    className="button" 
                    onClick={handleToggle}
                >
                    {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
                </button>
            </div>
        </div>
    );
};

export default Display;