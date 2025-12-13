import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from 'api';

const PaymentsVenmo = () => {
    const service = 'venmo';
    const [accounts, setAccounts] = useState([]);
    const [logs, setLogs] = useState([]); // State for History
    const [scanMessage, setScanMessage] = useState('');
    
    // Defaults set to Gmail for convenience
    const [newAcc, setNewAcc] = useState({ 
        email: '', 
        password: '', 
        imap_server: 'imap.gmail.com', 
        port: 993 
    });

    const fetchData = async () => { 
        try { 
            const r = await apiGet(`/payment_emails/${service}`); 
            setAccounts(r); 
            
            // Fetch Payment History
            const allLogs = await apiGet('/payment_logs');
            setLogs(allLogs.filter(l => l.service === 'Venmo'));
        } catch (e) { 
            setAccounts([]); 
            console.error(e);
        } 
    };
    
    useEffect(() => { fetchData(); }, []);

    const add = async (e) => {
        e.preventDefault();
        await apiPost(`/payment_emails/${service}`, newAcc, localStorage.getItem('admin_token'));
        setNewAcc({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
        fetchData();
    };

    const triggerScan = async () => {
        setScanMessage('Scanning...');
        try {
            const res = await apiPost(`/payment_emails/scan/${service}`, {}, localStorage.getItem('admin_token'));
            setScanMessage(res.message);
            fetchData(); // Refresh logs after scan
        } catch (e) { setScanMessage('Scan failed.'); }
    };

    return (
        <div>
            <h1>Venmo Email Scanners</h1>
            <p className="small" style={{marginBottom: '20px'}}>
                Monitor these email accounts for "paid you" notifications from Venmo.
            </p>

            {/* ACCOUNTS CARD */}
            <div className="card">
                <div className="flex" style={{justifyContent: 'space-between', marginBottom: '15px'}}>
                    <h3>Configured Accounts</h3>
                    <div className="flex">
                        <span className="small" style={{alignSelf: 'center'}}>{scanMessage}</span>
                        <button className="button" onClick={triggerScan}>Run Manual Scan</button>
                    </div>
                </div>
                
                <table className="table">
                    <thead><tr><th>Email</th><th>Server</th><th>Last Scan</th><th>Actions</th></tr></thead>
                    <tbody>
                        {accounts.map(acc => (
                            <tr key={acc.id}>
                                <td>{acc.email}</td>
                                <td>{acc.imap_server}</td>
                                <td>{acc.last_scanned || 'Never'}</td>
                                <td>
                                    <button className="button" style={{backgroundColor: 'var(--danger)', padding: '6px 12px', fontSize: '0.85rem'}} 
                                        onClick={async () => { 
                                            if(!window.confirm('Remove this scanner?')) return;
                                            await apiDelete(`/payment_emails/${service}/${acc.id}`, localStorage.getItem('admin_token')); 
                                            fetchData(); 
                                        }}>
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {accounts.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>No Venmo scanners configured.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* HISTORY CARD */}
            <div className="card">
                <h3>Payment History (Venmo)</h3>
                <table className="table">
                    <thead><tr><th>Date</th><th>Sender</th><th>Amount</th><th>Status</th><th>Matched User</th></tr></thead>
                    <tbody>
                        {logs.map((log, i) => (
                            <tr key={i}>
                                <td>{log.date}</td>
                                <td>{log.sender}</td>
                                <td>{log.amount}</td>
                                <td>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem',
                                        backgroundColor: log.status === 'Matched' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: log.status === 'Matched' ? '#10b981' : '#ef4444'
                                    }}>{log.status}</span>
                                </td>
                                <td>{log.mapped_user || '-'}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No payments found yet.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* ADD FORM */}
            <div className="card" style={{maxWidth: '600px'}}>
                <h3>Add New Venmo Scanner</h3>
                <form onSubmit={add} style={{display: 'grid', gap: '15px'}}>
                    <div>
                        <label className="small">Email Address</label>
                        <input className="input" placeholder="e.g. my.venmo.alerts@gmail.com" value={newAcc.email} onChange={e=>setNewAcc({...newAcc, email: e.target.value})} required />
                    </div>
                    
                    <div>
                        <label className="small">App Password (Required for Gmail/Yahoo)</label>
                        <input className="input" type="password" placeholder="16-character app password" value={newAcc.password} onChange={e=>setNewAcc({...newAcc, password: e.target.value})} required />
                    </div>

                    <div className="flex">
                        <div style={{flex: 2}}>
                            <label className="small">IMAP Server</label>
                            <input className="input" value={newAcc.imap_server} onChange={e=>setNewAcc({...newAcc, imap_server: e.target.value})} required />
                        </div>
                        <div style={{flex: 1}}>
                            <label className="small">Port</label>
                            <input className="input" type="number" value={newAcc.port} onChange={e=>setNewAcc({...newAcc, port: parseInt(e.target.value)})} required />
                        </div>
                    </div>

                    <button className="button" type="submit" style={{marginTop: '10px'}}>Connect Account</button>
                </form>
            </div>
        </div>
    );
};

export default PaymentsVenmo;