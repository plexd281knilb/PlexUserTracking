import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api';

const PaymentsVenmo = () => {
    const service = 'venmo';
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [scanMessage, setScanMessage] = useState('');
    const [newAccount, setNewAccount] = useState({
        email: '',
        password: '',
        imap_server: 'imap.gmail.com',
        port: 993,
    });

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/payment_emails/${service}`);
            setAccounts(response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAccount(prev => ({ ...prev, [name]: value }));
    };

    const handleAddAccount = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/payment_emails/${service}`, newAccount);
            setNewAccount({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
            fetchAccounts();
        } catch (error) {
            console.error('Error adding account:', error);
        }
    };

    const handleDeleteAccount = async (id) => {
        if (!window.confirm('Are you sure you want to delete this account?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/payment_emails/${service}/${id}`);
            fetchAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };
    
    const handleTriggerScan = async () => {
        setScanMessage('Scanning in progress...');
        try {
            const response = await axios.post(`${API_BASE_URL}/payment_emails/scan/${service}`);
            setScanMessage(response.data.message);
            // Optionally, refresh dashboard data here
        } catch (error) {
            setScanMessage('Scan failed. Check logs.');
            console.error('Scan error:', error);
        }
    };


    useEffect(() => {
        fetchAccounts();
    }, []);

    return (
        <div>
            <h1>Venmo Email Scanner Configuration</h1>
            <p className="text-muted-color">Manage the email accounts used to scan for Venmo payment confirmations and mark users as paid.</p>

            {/* --- Account List --- */}
            <div className="content-card">
                <h2>Configured Accounts ({service.toUpperCase()})</h2>
                {isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Email Address</th>
                                <th>IMAP Server</th>
                                <th>Last Scanned</th>
                                <th>Enabled</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map(account => (
                                <tr key={account.id}>
                                    <td>{account.email}</td>
                                    <td>{account.imap_server}</td>
                                    <td>{account.last_scanned || 'Never'}</td>
                                    <td>{account.enabled ? <span style={{color: 'green'}}>Yes</span> : <span style={{color: 'red'}}>No</span>}</td>
                                    <td>
                                        <button className="btn-primary" style={{backgroundColor: 'red', margin: '0'}} onClick={() => handleDeleteAccount(account.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p>{scanMessage || 'Ready to scan.'}</p>
                    <button className="btn-primary" onClick={handleTriggerScan}>Trigger Manual Scan</button>
                </div>
            </div>

            {/* --- Add New Account Form --- */}
            <div className="content-card">
                <h2>Add New Scanner Account</h2>
                <form onSubmit={handleAddAccount} style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
                    <input type="email" name="email" value={newAccount.email} onChange={handleInputChange} placeholder="Email (must allow IMAP)" required />
                    <input type="password" name="password" value={newAccount.password} onChange={handleInputChange} placeholder="Password/App Password" required />
                    <input type="text" name="imap_server" value={newAccount.imap_server} onChange={handleInputChange} placeholder="IMAP Server (e.g., imap.gmail.com)" required />
                    <input type="number" name="port" value={newAccount.port} onChange={handleInputChange} placeholder="Port (e.g., 993)" required />
                    
                    <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                        <button type="submit" className="btn-primary">Save Account</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentsVenmo;