import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';

// Import all sub-page components (assuming they are in the settings/ folder)
import Display from './settings/Display';
import Tautulli from './settings/Tautulli';
import System from './settings/System';
import Scan from './settings/Scan';
import Notifications from './settings/Notifications';

const Settings = () => {
    return (
        <div>
            <h1>Application Settings</h1>
            
            {/* Tab Navigation Structure using NavLink and CSS classes defined previously */}
            <div className="card" style={{ marginBottom: '12px' }}>
                <div className="nav flex" style={{gap: '15px'}}>
                    <NavLink to="display">Display</NavLink>
                    <NavLink to="tautulli">Tautulli</NavLink>
                    <NavLink to="scan">Scan</NavLink>
                    <NavLink to="notifications">Notifications</NavLink>
                    <NavLink to="system">System</NavLink>
                </div>
            </div>

            <div className="settings-content">
                <Routes>
                    {/* Default route when navigating to /settings */}
                    <Route index element={<Navigate to="display" replace />} />
                    
                    {/* Routes for each settings sub-page */}
                    <Route path="display" element={<Display />} />
                    <Route path="tautulli" element={<Tautulli />} />
                    <Route path="scan" element={<Scan />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="system" element={<System />} />
                </Routes>
            </div>
        </div>
    );
};

export default Settings;