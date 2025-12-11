import React from 'react';
import { API_BASE_URL } from '../../api';

const Venmo = () => {
    return (
        <div className="payment-scanner-config">
            <h3>Venmo Configuration</h3>
            
            <div className="content-card">
                <p>Use this section to configure the email accounts the application should scan for Venmo payment notifications.</p>
                
                {/* Placeholder for list of configured accounts */}
                <div style={{ marginTop: '20px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '5px', backgroundColor: 'var(--background-color)'}}>
                    <p style={{ color: 'var(--text-muted-color)' }}>No Venmo accounts configured yet.</p>
                </div>
                
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end'}}>
                    <button className="btn-primary">Add New Venmo Account</button>
                </div>
            </div>

            <div className="content-card">
                <h4>Venmo API Endpoints</h4>
                <p>The backend exposes the following endpoints for Venmo data:</p>
                <code style={{ display: 'block', padding: '10px', backgroundColor: 'var(--background-color)', color: 'var(--text-color)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    GET {API_BASE_URL}/payment_emails/venmo
                </code>
            </div>
        </div>
    );
};

export default Venmo;