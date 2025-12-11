import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../../api';

const PaymentsPaypal = () => {
    // CORRECTED: Service must be 'paypal'
    const service = 'paypal'; 
    
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
            const response = await apiGet(`/payment_emails/${service}`); 
            setAccounts(response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setAccounts([]);
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
            await apiPost(`/payment_emails/${service}`, newAccount, localStorage.getItem('admin_token'));
            setNewAccount({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
            fetchAccounts();
        } catch (error) {
            console.error('Error adding account:', error);
            alert('Failed to add account. Check server logs.');
        }
    };

    const handleDeleteAccount = async (id) => {
        if (!window.confirm('Are you sure you want to delete this account?')) return;
        try {
            await apiDelete(`/payment_emails/${service}/${id}`, localStorage.getItem('admin_token'));
            fetchAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };
    
    const handleTriggerScan = async () => {
        setScanMessage('Scanning in progress...');
        try {
            const response = await apiPost(`/payment_emails/scan/${service}`, {}, localStorage.getItem('admin_token'));
            setScanMessage(response.data.message);
        } catch (error) {
            setScanMessage('Scan failed. Check server logs.');
            console.error('Scan error:', error);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, [service]); 

    return (
        <div>
            <h1>PayPal Email Scanner Configuration</h1>
            <p className="small">Manage the email accounts used to scan for PayPal payment confirmations and mark users as paid.</p>

            <div className="card">
                <h2>Configured Accounts ({service.toUpperCase()})</h2>
                {isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <table className="table">
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
                                    <td>{account.enabled ? <span style={{color: 'var(--accent)'}}>Yes</span> : <span style={{color: 'red'}}>No</span>}</td>
                                    <td>
                                        <button className="button" style={{ backgroundColor: 'red', margin: '0' }} onClick={() => handleDeleteAccount(account.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                
                <div className="flex" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', justifyContent: 'space-between' }}>
                    <p className="small">{scanMessage || 'Ready to scan.'}</p>
                    <button className="button" onClick={handleTriggerScan}>Trigger Manual Scan</button>
                </div>
            </div>

            <div className="card">
                <h2>Add New Scanner Account</h2>
                <form onSubmit={handleAddAccount} style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
                    <input className="input" type="email" name="email" value={newAccount.email} onChange={handleInputChange} placeholder="Email (must allow IMAP)" required />
                    <input className="input" type="password" name="password" value={newAccount.password} onChange={handleInputChange} placeholder="Password/App Password" required />
                    <input className="input" type="text" name="imap_server" value={newAccount.imap_server} onChange={handleInputChange} placeholder="IMAP Server (e.g., imap.gmail.com)" required />
                    <input className="input" type="number" name="port" value={newAccount.port} onChange={handleInputChange} placeholder="Port (e.g., 993)" required />
                    
                    <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                        <button type="submit" className="button">Save Account</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentsPaypal;