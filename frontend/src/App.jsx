import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';

// Import Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Expenses from './pages/Expenses';
import PaymentsVenmo from './pages/payments/Venmo';
import PaymentsZelle from './pages/payments/Zelle';
import PaymentsPaypal from './pages/payments/Paypal';
import PlexSettings from './pages/settings/Plex';
import TautulliSettings from './pages/settings/Tautulli';
import NotificationSettings from './pages/settings/Notifications';
import SystemSettings from './pages/settings/System';
import ScanSettings from './pages/settings/Scan';

// Sidebar Component
const Sidebar = () => (
    <div className="sidebar" style={{width: '250px', backgroundColor: '#1e293b', padding: '20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #334155'}}>
        <h2 style={{color: '#f1f5f9', marginBottom: '30px', paddingLeft: '10px'}}>PLEX TRACKER</h2>
        
        <div className="nav-group">
            <p className="nav-label" style={{color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '10px'}}>Dashboard</p>
            <NavLink to="/" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>📊 Overview</NavLink>
            <NavLink to="/users" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>👥 Users</NavLink>
        </div>

        <div className="nav-group" style={{marginTop: '20px'}}>
            <p className="nav-label" style={{color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '10px'}}>Payments</p>
            <NavLink to="/payments/venmo" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>🔵 Venmo</NavLink>
            <NavLink to="/payments/zelle" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>🟣 Zelle</NavLink>
            <NavLink to="/payments/paypal" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>💳 PayPal</NavLink>
        </div>

        <div className="nav-group" style={{marginTop: '20px'}}>
            <p className="nav-label" style={{color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '10px'}}>System</p>
            <NavLink to="/expenses" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>💰 Expenses</NavLink>
            <NavLink to="/settings/plex" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>⚙️ Settings</NavLink>
        </div>
    </div>
);

function App() {
  return (
    <Router>
      <div className="app-root" style={{display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9'}}>
        <Sidebar />
        <div className="main" style={{flex: 1, padding: '30px', overflowY: 'auto'}}>
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/expenses" element={<Expenses />} />
            
            {/* Payment Routes */}
            <Route path="/payments/venmo" element={<PaymentsVenmo />} />
            <Route path="/payments/zelle" element={<PaymentsZelle />} />
            <Route path="/payments/paypal" element={<PaymentsPaypal />} />
            
            {/* Settings Routes */}
            <Route path="/settings/plex" element={<PlexSettings />} />
            <Route path="/settings/tautulli" element={<TautulliSettings />} />
            <Route path="/settings/notifications" element={<NotificationSettings />} />
            <Route path="/settings/system" element={<SystemSettings />} />
            <Route path="/settings/scan" element={<ScanSettings />} />

            {/* CATCH-ALL REDIRECT: Sends 404s back to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;