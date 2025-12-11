import React from 'react';
import { API_BASE_URL } from '../api';

const PaymentsVenmo = () => {
    // Placeholder Data
    const accounts = [
        { id: 1, email: 'venmo.scanner.1@gmail.com', enabled: true },
        { id: 2, email: 'plex.payments@outlook.com', enabled: false },
    ];
    
    return (
        <div>
            <h1>Venmo Email Scanner</h1>
            <p className="text-muted-color">Configure the email accounts the backend should scan for Venmo payment notifications. Note: This page needs a file named `PaymentsVenmo.jsx` in `frontend/src/pages/`.</p>
            
            <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                    <button className="btn-primary">Add New Account</button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Email Address</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map(account => (
                            <tr key={account.id}>
                                <td>{account.email}</td>
                                <td>{account.enabled ? <span style={{color: 'green'}}>Enabled</span> : <span style={{color: 'red'}}>Disabled</span>}</td>
                                <td><button className="btn-primary" style={{marginRight: '5px'}}>Edit</button><button className="btn-primary" style={{backgroundColor: 'red'}}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="content-card">
                <h4>Backend API Check</h4>
                <code style={{ display: 'block', padding: '10px', backgroundColor: 'var(--background-color)', color: 'var(--text-color)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    GET {API_BASE_URL}/payment_emails/venmo
                </code>
            </div>
        </div>
    );
};

export default PaymentsVenmo;