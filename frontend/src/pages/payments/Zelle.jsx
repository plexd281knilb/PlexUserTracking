import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from 'api';

const PaymentsZelle = () => {
    const service = 'zelle';
    const [accounts, setAccounts] = useState([]);
    const [logs, setLogs] = useState([]); // State for History
    const [scanMessage, setScanMessage] = useState('');
    const [newAcc, setNewAcc] = useState({ 
        email: '', password: '', imap_server: 'imap.gmail.com', port: 993 
    });

    const fetchData = async () => { 
        try { 
            const accs = await apiGet(`/payment_emails/${service}`); 
            setAccounts(accs); 
            
            // Fetch Payment History
            const allLogs = await apiGet('/payment_logs');
            setLogs(allLogs.filter(l => l.service === 'Zelle'));
        } catch (e) { console.error(e); } 
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
            <h1>Zelle Scanners</h1>
            <p className="small" style={{marginBottom: '20px'}}>Monitor for Zelle payment notifications.</p>

            {/* ACCOUNTS CARD */}
            <div className="card">
                <div className="flex" style={{justifyContent: 'space-between', marginBottom: '15px'}}>
                    <h3>Configured Accounts</h3>
                    <div className="flex">
                        <span className="small">{scanMessage}</span>
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
                                    <button className="button" style={{backgroundColor: 'var(--danger)', padding: '5px 10px'}} 
                                        onClick={async () => { 
                                            if(!window.confirm('Remove?')) return;
                                            await apiDelete(`/payment_emails/${service}/${acc.id}`, localStorage.getItem('admin_token')); 
                                            fetchData(); 
                                        }}>Remove</button>
                                </td>
                            </tr>
                        ))}
                        {accounts.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>No scanners configured.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* HISTORY CARD */}
            <div className="card">
                <h3>Payment History (Zelle)</h3>
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
                <h3>Add New Scanner</h3>
                <form onSubmit={add} style={{display: 'grid', gap: '15px'}}>
                    <input className="input" placeholder="Email Address" value={newAcc.email} onChange={e=>setNewAcc({...newAcc, email: e.target.value})} required />
                    <input className="input" type="password" placeholder="App Password" value={newAcc.password} onChange={e=>setNewAcc({...newAcc, password: e.target.value})} required />
                    <div className="flex">
                        <input className="input" value={newAcc.imap_server} onChange={e=>setNewAcc({...newAcc, imap_server: e.target.value})} style={{flex:2}} />
                        <input className="input" type="number" value={newAcc.port} onChange={e=>setNewAcc({...newAcc, port: parseInt(e.target.value)})} style={{flex:1}} />
                    </div>
                    <button className="button" type="submit">Connect Account</button>
                </form>
            </div>
        </div>
    );
};
export default PaymentsZelle;