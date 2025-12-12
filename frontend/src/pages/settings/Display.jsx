import React, { useContext } from 'react';
import { ThemeContext } from '../../App'; 
import { apiGet, apiPost } from 'api'; // Clean Import

const Display = () => {
    const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
    return (
        <div className="card">
            <h3>Display Settings</h3>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <label style={{ fontWeight: 'bold' }}>Dark Mode</label>
                    <p className="small" style={{ margin: 0 }}>Toggle application theme.</p>
                </div>
                <button className="button" onClick={() => setIsDarkMode(prev => !prev)}>
                    {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
                </button>
            </div>
        </div>
    );
};
export default Display;