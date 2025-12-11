import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';

// Import all sub-page components
import Display from './settings/Display';
import Tautulli from './settings/Tautulli';
import System from './settings/System';
import Scan from './settings/Scan';
import Notifications from './settings/Notifications';

const Settings = () => {
    return (
        <div>
            <h1>Application Settings</h1>
            
            {/* Tab Navigation Structure */}
            <div className="card" style={{ marginBottom: '12px' }}>
                <div className="nav flex" style={{gap: '15px'}}>
                    <NavLink to="display">Display</NavLink>
                    <NavLink to="tautulli">Tautulli</NavLink>
                    <NavLink to="scan">Scan Settings</NavLink>
                    <NavLink to="notifications">Notifications</NavLink>
                    <NavLink to="system">System</NavLink>
                </div>
            </div>

            <div className="settings-content">
                <Routes>
                    <Route index element={<Navigate to="display" replace />} />
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