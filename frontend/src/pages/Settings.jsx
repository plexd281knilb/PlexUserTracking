import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import Display from './settings/Display';
import Tautulli from './settings/Tautulli';
import System from './settings/System';
import Scan from './settings/Scan';
import Notifications from './settings/Notifications';

// This is the main Settings page which hosts the sub-navigation
const Settings = () => {
    return (
        <div>
            <h1>Application Settings</h1>
            
            <div className="tab-navigation content-card" style={{ padding: '0 1.5rem 0 1.5rem', marginBottom: '1.5rem' }}>
                <NavLink 
                    to="display" 
                    className={({ isActive }) => isActive ? 'tab-link active' : 'tab-link'}
                >
                    Display
                </NavLink>
                <NavLink 
                    to="tautulli" 
                    className={({ isActive }) => isActive ? 'tab-link active' : 'tab-link'}
                >
                    Tautulli
                </NavLink>
                <NavLink 
                    to="scan" 
                    className={({ isActive }) => isActive ? 'tab-link active' : 'tab-link'}
                >
                    Scan
                </NavLink>
                <NavLink 
                    to="notifications" 
                    className={({ isActive }) => isActive ? 'tab-link active' : 'tab-link'}
                >
                    Notifications
                </NavLink>
                <NavLink 
                    to="system" 
                    className={({ isActive }) => isActive ? 'tab-link active' : 'tab-link'}
                >
                    System
                </NavLink>
            </div>

            <div className="settings-content">
                <Routes>
                    <Route index element={<Navigate to="display" replace />} />
                    <Route path="display" element={<Display />} />
                    <Route path="tautulli" element={<Tautulli />} />
                    <Route path="scan" element={<Scan />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="system" element={<System />} />
                    <Route path="*" element={<Navigate to="display" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default Settings;