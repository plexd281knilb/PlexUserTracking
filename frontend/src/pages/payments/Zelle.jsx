import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "api";

export default function Zelle() {
    const [accounts, setAccounts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [newAccount, setNewAccount] = useState({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Match Modal State
    const [matchLog, setMatchLog] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');

    const fetchData = async () => {
        try {
            const [accs, logsData, usersData] = await Promise.all([
                apiGet("/payments/accounts/zelle"),
                apiGet("/payment_logs"),
                apiGet("/users")
            ]);
            setAccounts(accs);
            // Filter logs for Zelle
            setLogs(logsData.filter(l => l.service === 'Zelle'));
            setUsers(usersData);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAdd = async () => {
        setStatus('Testing Connection...');
        try {
            await apiPost("/payments/accounts/zelle", newAccount, localStorage.getItem('admin_token'));
            setNewAccount({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
            setStatus('');
            fetchData();
            alert("Connected successfully!");
        } catch (e) {
            setStatus('Connection Failed');
            alert(`Failed: ${e.message || 'Check credentials'}`);
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Remove this account?")) return;
        await apiDelete(`/payments/accounts/zelle/${id}`, localStorage.getItem('admin_token'));
        fetchData();
    };

    const handleScan = async () => {
        setLoading(true);
        try {
            const res = await apiPost("/payments/scan/zelle", {}, localStorage.getItem('admin_token'));
            alert(res.message);
            fetchData();
        } catch (e) { alert("Scan failed"); }
        setLoading(false);
    };

    const handleMatch = async () => {
        if(!selectedUserId) return;
        if(!window.confirm(`Link this payment to selected user?`)) return;
        
        await apiPost(`/users/${selectedUserId}/match_payment`, {
            date: matchLog.date,
            raw_text: matchLog.raw_text,
            amount: matchLog.amount,
            sender: matchLog.sender
        }, localStorage.getItem('admin_token'));
        
        setMatchLog(null);
        fetchData();
    };

    return (
        <div className="card">
            <div className="flex" style={{justifyContent:'space-between', alignItems:'center'}}>
                <h3>Zelle Scanners</h3>
                <button className="button" onClick={handleScan} disabled={loading}>
                    {loading ? 'Scanning...' : 'Scan Now'}
                </button>
            </div>

            <table className="table" style={{marginTop:'20px'}}>
                <thead><tr><th>Email</th><th>Server</th><th>Last Scanned</th><th>Action</th></tr></thead>
                <tbody>
                    {accounts.map(acc => (
                        <tr key={acc.id}>
                            <td>{acc.email}</td>
                            <td>{acc.imap_server}</td>
                            <td>{acc.last_scanned || 'Never'}</td>
                            <td><button className="button" style={{backgroundColor:'var(--danger)', padding:'4px 8px', fontSize:'0.7rem'}} onClick={() => handleDelete(acc.id)}>Remove</button></td>
                        </tr>
                    ))}
                    {accounts.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>No accounts configured.</td></tr>}
                </tbody>
            </table>

            <div style={{marginTop:'30px', borderTop:'1px solid var(--border)', paddingTop:'20px'}}>
                <h4>Add New Account</h4>
                <div className="flex" style={{gap:'10px', flexWrap:'wrap'}}>
                    <div style={{flex: 2}}>
                        <label className="small">Email</label>
                        <input className="input" placeholder="user@gmail.com" value={newAccount.email} onChange={e=>setNewAccount({...newAccount, email: e.target.value})} />
                    </div>
                    <div style={{flex: 2}}>
                        <label className="small">App Password</label>
                        <input className="input" type="password" placeholder="App Password" value={newAccount.password} onChange={e=>setNewAccount({...newAccount, password: e.target.value})} />
                    </div>
                </div>
                <div className="flex" style={{gap:'10px', marginTop:'10px'}}>
                    <div style={{flex: 2}}>
                        <label className="small">IMAP Server</label>
                        <input className="input" placeholder="imap.gmail.com" value={newAccount.imap_server} onChange={e=>setNewAccount({...newAccount, imap_server: e.target.value})} />
                    </div>
                    <div style={{flex: 1}}>
                        <label className="small">Port</label>
                        <input className="input" placeholder="993" value={newAccount.port} onChange={e=>setNewAccount({...newAccount, port: e.target.value})} />
                    </div>
                </div>
                <div style={{marginTop:'15px', display:'flex', alignItems:'center', gap:'10px'}}>
                    <button className="button" onClick={handleAdd}>Save & Test</button>
                    {status && <span className="small" style={{color: status.includes('Failed') ? '#ef4444' : '#10b981'}}>{status}</span>}
                </div>
            </div>

            <div style={{marginTop: '40px', borderTop:'1px solid var(--border)', paddingTop:'20px'}}>
                <h3>Payment History</h3>
                <table className="table">
                    <thead><tr><th>Date</th><th>Sender</th><th>Amount</th><th>Status</th><th>Matched User</th><th>Action</th></tr></thead>
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
                                <td>
                                    {log.status === 'Unmapped' && (
                                        <button className="button" style={{padding:'4px 8px', fontSize:'0.7rem', backgroundColor:'#f59e0b'}} 
                                            onClick={() => { setMatchLog(log); setSelectedUserId(''); }}>
                                            Link User
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && <tr><td colSpan="6" style={{textAlign:'center'}}>No payment history found.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Match Modal */}
            {matchLog && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{minWidth: '400px'}}>
                        <h3>Link Payment</h3>
                        <p className="small">Sender: <b>{matchLog.sender}</b> ({matchLog.amount})</p>
                        <div style={{marginTop: '15px'}}>
                            <label className="small">Select Plex User</label>
                            <select className="input" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                                <option value="">-- Select User --</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.username} {u.full_name ? `(${u.full_name})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex" style={{marginTop:'20px', justifyContent:'flex-end', gap:'10px'}}>
                            <button className="button" style={{backgroundColor:'#64748b'}} onClick={() => setMatchLog(null)}>Cancel</button>
                            <button className="button" onClick={handleMatch} disabled={!selectedUserId}>Confirm Link</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}