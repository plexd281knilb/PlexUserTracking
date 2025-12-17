import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "api";

export default function Zelle() {
    const [accounts, setAccounts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [newAccount, setNewAccount] = useState({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
    const [searchTerm, setSearchTerm] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [matchLog, setMatchLog] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');

    const fetchData = async () => {
        const [accs, logsData, usersData, settings] = await Promise.all([
            apiGet("/payments/accounts/zelle"),
            apiGet("/payment_logs"),
            apiGet("/users"),
            apiGet("/settings")
        ]);
        setAccounts(accs);
        setLogs(logsData.filter(l => l.service === 'Zelle'));
        setUsers(usersData);
        setSearchTerm(settings.zelle_search_term || 'received');
    };

    useEffect(() => { fetchData(); }, []);

    const handleAdd = async () => {
        setStatus('Testing...');
        try {
            await apiPost("/payments/accounts/zelle", newAccount, localStorage.getItem('admin_token'));
            setNewAccount({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
            setStatus(''); fetchData(); alert("Success!");
        } catch (e) { setStatus('Failed'); alert(e.message); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Remove?")) return;
        await apiDelete(`/payments/accounts/zelle/${id}`, localStorage.getItem('admin_token'));
        fetchData();
    };

    const handleScan = async () => {
        setLoading(true);
        await apiPost("/payments/scan/zelle", {}, localStorage.getItem('admin_token'));
        fetchData(); setLoading(false);
    };

    const handleDeleteLog = async (log) => {
        if(!window.confirm("Delete log?")) return;
        await apiPost("/payments/logs/delete", log, localStorage.getItem('admin_token'));
        fetchData();
    };

    const handleSaveSettings = async () => {
        await apiPost("/settings", { zelle_search_term: searchTerm }, localStorage.getItem('admin_token'));
        alert("Search term saved.");
    };

    const handleMatch = async () => {
        if(!selectedUserId) return;
        await apiPost(`/users/${selectedUserId}/match_payment`, {
            date: matchLog.date, raw_text: matchLog.raw_text, amount: matchLog.amount, sender: matchLog.sender
        }, localStorage.getItem('admin_token'));
        setMatchLog(null); fetchData();
    };

    return (
        <div className="card">
            <div className="flex" style={{justifyContent:'space-between'}}>
                <h3>Zelle Scanners</h3>
                <button className="button" onClick={handleScan} disabled={loading}>{loading?'Scanning...':'Scan Now'}</button>
            </div>

            <div style={{marginTop:'20px', padding:'10px', backgroundColor:'var(--bg-input)', borderRadius:'8px', display:'flex', alignItems:'center', gap:'10px'}}>
                <label className="small" style={{whiteSpace:'nowrap'}}>Search Term (Subject):</label>
                <input className="input" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                <button className="button" style={{padding:'4px 10px'}} onClick={handleSaveSettings}>Save Config</button>
            </div>

            <table className="table" style={{marginTop:'20px'}}>
                <thead><tr><th>Email</th><th>Server</th><th>Last Scanned</th><th>Action</th></tr></thead>
                <tbody>
                    {accounts.map(acc => (
                        <tr key={acc.id}>
                            <td>{acc.email}</td><td>{acc.imap_server}</td><td>{acc.last_scanned}</td>
                            <td><button className="button" style={{backgroundColor:'var(--danger)', padding:'4px'}} onClick={()=>handleDelete(acc.id)}>Remove</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{marginTop:'30px', borderTop:'1px solid var(--border)', paddingTop:'20px'}}>
                <h4>Add Account</h4>
                <div className="flex" style={{gap:'10px'}}>
                    <input className="input" placeholder="Email" value={newAccount.email} onChange={e=>setNewAccount({...newAccount, email:e.target.value})} />
                    <input className="input" type="password" placeholder="App Password" value={newAccount.password} onChange={e=>setNewAccount({...newAccount, password:e.target.value})} />
                </div>
                <button className="button" style={{marginTop:'10px'}} onClick={handleAdd}>Save & Test</button>
                {status && <span className="small" style={{color:'red', marginLeft:'10px'}}>{status}</span>}
            </div>

            <div style={{marginTop:'40px'}}>
                <h3>History</h3>
                <table className="table">
                    <thead><tr><th>Date</th><th>Sender</th><th>Amount</th><th>Status</th><th>User</th><th>Actions</th></tr></thead>
                    <tbody>
                        {logs.map((log, i) => (
                            <tr key={i}>
                                <td>{log.date}</td><td>{log.sender}</td><td>{log.amount}</td>
                                <td>{log.status}</td><td>{log.mapped_user || '-'}</td>
                                <td>
                                    <div className="flex" style={{gap:'5px'}}>
                                        {log.status === 'Unmapped' && <button className="button" style={{backgroundColor:'#f59e0b', padding:'4px'}} onClick={()=>{setMatchLog(log); setSelectedUserId('');}}>Link</button>}
                                        <button className="button" style={{backgroundColor:'#ef4444', padding:'4px'}} onClick={()=>handleDeleteLog(log)}>Del</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {matchLog && (
                <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center'}}>
                    <div className="card" style={{minWidth:'400px'}}>
                        <h3>Link Payment</h3>
                        <p>Sender: <b>{matchLog.sender}</b> ({matchLog.amount})</p>
                        <select className="input" value={selectedUserId} onChange={e=>setSelectedUserId(e.target.value)} style={{marginTop:'10px'}}>
                            <option value="">Select User...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.full_name})</option>)}
                        </select>
                        <div className="flex" style={{marginTop:'20px', gap:'10px', justifyContent:'flex-end'}}>
                            <button className="button" style={{backgroundColor:'#64748b'}} onClick={()=>setMatchLog(null)}>Cancel</button>
                            <button className="button" onClick={handleMatch}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}