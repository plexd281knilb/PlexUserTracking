import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "api";

export default function Venmo() {
    const [accounts, setAccounts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [newAccount, setNewAccount] = useState({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
    const [searchTerm, setSearchTerm] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Modals
    const [matchLog, setMatchLog] = useState(null);
    const [splitLog, setSplitLog] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [splitAmounts, setSplitAmounts] = useState(['', '']);

    const fetchData = async () => {
        const [accs, logsData, usersData, settings] = await Promise.all([
            apiGet("/payments/accounts/venmo"),
            apiGet("/payment_logs"),
            apiGet("/users"),
            apiGet("/settings")
        ]);
        setAccounts(accs);
        setLogs(logsData.filter(l => l.service === 'Venmo'));
        setUsers(usersData);
        setSearchTerm(settings.venmo_search_term || 'paid you');
    };

    useEffect(() => { fetchData(); }, []);

    const handleAdd = async () => {
        setStatus('Testing...');
        try {
            await apiPost("/payments/accounts/venmo", newAccount, localStorage.getItem('admin_token'));
            setNewAccount({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
            setStatus(''); fetchData(); alert("Success!");
        } catch (e) { setStatus('Failed'); alert(e.message); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Remove?")) return;
        await apiDelete(`/payments/accounts/venmo/${id}`, localStorage.getItem('admin_token'));
        fetchData();
    };

    const handleScan = async () => {
        setLoading(true);
        try {
            const res = await apiPost("/payments/scan/venmo", {}, localStorage.getItem('admin_token'));
            alert(res.message);
            fetchData();
        } catch (e) { alert("Scan failed"); }
        setLoading(false);
    };

    const handleDeleteLog = async (log) => {
        if(!window.confirm("Delete log?")) return;
        await apiPost("/payments/logs/delete", log, localStorage.getItem('admin_token'));
        fetchData();
    };

    const handleSaveSettings = async () => {
        await apiPost("/settings", { venmo_search_term: searchTerm }, localStorage.getItem('admin_token'));
        alert("Search term saved.");
    };

    const handleMatch = async () => {
        if(!selectedUserId) return;
        await apiPost(`/users/${selectedUserId}/match_payment`, {
            date: matchLog.date, raw_text: matchLog.raw_text, amount: matchLog.amount, sender: matchLog.sender
        }, localStorage.getItem('admin_token'));
        setMatchLog(null); fetchData();
    };

    const handleSplitSubmit = async () => {
        const splits = splitAmounts.map(a => ({ amount: a }));
        if(splits.some(s => !s.amount)) { alert("Please enter all amounts"); return; }
        
        try {
            await apiPost("/payments/split", { original: splitLog, splits }, localStorage.getItem('admin_token'));
            setSplitLog(null);
            setSplitAmounts(['', '']);
            fetchData();
        } catch(e) { alert("Split failed"); }
    };

    const addSplitRow = () => setSplitAmounts([...splitAmounts, '']);

    return (
        <div className="container">
            <div className="flex-between">
                <h3>Venmo Scanners</h3>
                <button className="button" onClick={handleScan} disabled={loading}>{loading?'Scanning...':'Scan Now'}</button>
            </div>

            <div className="card grid-responsive" style={{marginTop:'20px', alignItems:'end'}}>
                <div style={{flex:1}}>
                    <label>Search Term (Subject):</label>
                    <input className="input" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                </div>
                <button className="button btn-secondary" onClick={handleSaveSettings}>Save Config</button>
            </div>

            <div className="card table-container">
                <table className="table">
                    <thead><tr><th>Email</th><th>Server</th><th>Last Scanned</th><th>Action</th></tr></thead>
                    <tbody>
                        {accounts.map(acc => (
                            <tr key={acc.id}>
                                <td>{acc.email}</td><td>{acc.imap_server}</td><td>{acc.last_scanned}</td>
                                <td><button className="button btn-danger btn-sm" onClick={()=>handleDelete(acc.id)}>Remove</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <h4>Add Account</h4>
                <div className="grid-responsive" style={{alignItems:'end'}}>
                    <div style={{flex:1}}><label>Email</label><input className="input" placeholder="Email" value={newAccount.email} onChange={e=>setNewAccount({...newAccount, email:e.target.value})} /></div>
                    <div style={{flex:1}}><label>App Password</label><input className="input" type="password" placeholder="App Password" value={newAccount.password} onChange={e=>setNewAccount({...newAccount, password:e.target.value})} /></div>
                    <button className="button" onClick={handleAdd}>Save & Test</button>
                </div>
                {status && <span className="small" style={{color:'var(--danger)', marginTop:'10px'}}>{status}</span>}
            </div>

            <div className="card table-container">
                <h3>History</h3>
                <table className="table">
                    <thead><tr><th>Date</th><th>Sender</th><th>Amount</th><th>Status</th><th>User</th><th>Actions</th></tr></thead>
                    <tbody>
                        {logs.map((log, i) => (
                            <tr key={i} style={{opacity: log.status === 'Split' ? 0.5 : 1}}>
                                <td>{log.date}</td><td>{log.sender}</td><td>{log.amount}</td>
                                <td>{log.status}</td><td>{log.mapped_user || '-'}</td>
                                <td>
                                    <div className="flex-gap">
                                        {log.status === 'Unmapped' && (
                                            <>
                                                <button className="button btn-warning btn-sm" onClick={()=>{setMatchLog(log); setSelectedUserId('');}}>Link</button>
                                                <button className="button btn-secondary btn-sm" onClick={()=>{setSplitLog(log); setSplitAmounts(['','']);}}>Split</button>
                                            </>
                                        )}
                                        <button className="button btn-danger btn-sm" onClick={()=>handleDeleteLog(log)}>Del</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {matchLog && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Link Payment</h3>
                        <p>Sender: <b>{matchLog.sender}</b> ({matchLog.amount})</p>
                        <select className="input" value={selectedUserId} onChange={e=>setSelectedUserId(e.target.value)} style={{marginTop:'10px'}}>
                            <option value="">Select User...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.full_name})</option>)}
                        </select>
                        <div className="flex-end" style={{marginTop:'20px'}}>
                            <button className="button btn-secondary" onClick={()=>setMatchLog(null)}>Cancel</button>
                            <button className="button" onClick={handleMatch}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {splitLog && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Split Payment: {splitLog.amount}</h3>
                        <p className="small">Original Sender: {splitLog.sender}</p>
                        
                        <div style={{marginTop:'15px', display:'grid', gap:'10px'}}>
                            {splitAmounts.map((amt, idx) => (
                                <div key={idx} className="flex-gap">
                                    <label className="small">Part {idx+1}: $</label>
                                    <input className="input" placeholder="0.00" value={amt} onChange={e => {
                                        const newAmts = [...splitAmounts];
                                        newAmts[idx] = e.target.value;
                                        setSplitAmounts(newAmts);
                                    }} />
                                </div>
                            ))}
                        </div>
                        <button className="button btn-secondary btn-sm" style={{marginTop:'10px'}} onClick={addSplitRow}>+ Add Split</button>

                        <div className="flex-end" style={{marginTop:'20px'}}>
                            <button className="button btn-secondary" onClick={()=>setSplitLog(null)}>Cancel</button>
                            <button className="button" onClick={handleSplitSubmit}>Save Splits</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}