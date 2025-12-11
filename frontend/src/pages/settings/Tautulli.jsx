import React from 'react';

const Tautulli = () => {
    return (
        <div className="settings-page">
            <h2>Tautulli Integration</h2>
            
            <div className="content-card">
                <p>Connect Plex User Tracking to your Tautulli instance to sync user activity, last seen times, and media usage statistics.</p>
                
                <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr', maxWidth: '500px' }}>
                    <label>Tautulli API Key</label>
                    <input type="text" placeholder="Enter Tautulli API Key..." />
                    
                    <label>Tautulli Base URL</label>
                    <input type="text" placeholder="e.g., http://192.168.1.10:8181" />
                    
                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                        <button className="btn-primary">Test Connection & Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tautulli;