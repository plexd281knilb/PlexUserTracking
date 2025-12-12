import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';

// Import all sub-page components
import Display from './settings/Display';
import Plex from './settings/Plex';
import Tautulli from './settings/Tautulli';
import System from './settings/System';
import Scan from './settings/Scan';
import Notifications from './settings/Notifications';

const Settings = () => {
    return (
        <div>
            <h1 style={{ marginBottom: '10px' }}>Application Settings</h1>
            <p className="small" style={{ marginBottom: '25px' }}>
                Manage integrations, notifications, and system preferences.
            </p>
            
            {/* Navigation Tabs */}
            <div className="settings-nav">
                <NavLink to="display">Display</NavLink>
                <NavLink to="plex">Plex</NavLink>
                <NavLink to="tautulli">Tautulli</NavLink>
                <NavLink to="notifications">Notifications</NavLink>
                <NavLink to="scan">Scan</NavLink>
                <NavLink to="system">System</NavLink>
            </div>

            {/* Content Area */}
            <div className="settings-content">
                <Routes>
                    <Route index element={<Navigate to="display" replace />} />
                    <Route path="display" element={<Display />} />
                    <Route path="plex" element={<Plex />} />
                    <Route path="tautulli" element={<Tautulli />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="scan" element={<Scan />} />
                    <Route path="system" element={<System />} />
                </Routes>
            </div>
        </div>
    );
};

export default Settings;