import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "api";

export default function Paypal() {
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
            apiGet("/payments/accounts/paypal"),
            apiGet("/payment_logs"),
            apiGet("/users"),
            apiGet("/settings")
        ]);
        setAccounts(accs);
        setLogs(logsData.filter(l => l.service === 'PayPal'));
        setUsers(usersData);
        setSearchTerm(settings.paypal_search_term || 'sent you');
    };

    useEffect(() => { fetchData(); }, []);

    const handleAdd = async () => {
        setStatus('Testing...');
        try {
            await apiPost("/payments/accounts/paypal", newAccount, localStorage.getItem('admin_token'));
            setNewAccount({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
            setStatus(''); fetchData(); alert("Success!");
        } catch (e) { setStatus('Failed'); alert(e.message); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Remove?")) return;
        await apiDelete(`/payments/accounts/paypal/${id}`, localStorage.getItem('admin_token'));
        fetchData();
    };

    const handleScan = async () => {
        setLoading(true);
        try {
            const res = await apiPost("/payments/scan/paypal", {}, localStorage.getItem('admin_token'));
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
        await apiPost("/settings", { paypal_search_term: searchTerm }, localStorage.getItem('admin_token'));
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
            setSplitLog(null); setSplitAmounts(['', '']); fetchData();
        } catch(e) { alert("Split failed"); }
    };

    const addSplitRow = () => setSplitAmounts([...splitAmounts, '']);

    return (
        <div className="card">
            <div className="flex" style={{justifyContent:'space-between'}}>
                <h3>PayPal Scanners</h3>
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
                            <tr key={i} style={{opacity: log.status === 'Split' ? 0.5 : 1}}>
                                <td>{log.date}</td><td>{log.sender}</td><td>{log.amount}</td>
                                <td>{log.status}</td><td>{log.mapped_user || '-'}</td>
                                <td>
                                    <div className="flex" style={{gap:'5px'}}>
                                        {log.status === 'Unmapped' && (
                                            <>
                                                <button className="button" style={{backgroundColor:'#f59e0b', padding:'4px'}} onClick={()=>{setMatchLog(log); setSelectedUserId('');}}>Link</button>
                                                <button className="button" style={{backgroundColor:'#3b82f6', padding:'4px'}} onClick={()=>{setSplitLog(log); setSplitAmounts(['','']);}}>Split</button>
                                            </>
                                        )}
                                        <button className="button" style={{backgroundColor:'#ef4444', padding:'4px'}} onClick={()=>handleDeleteLog(log)}>Del</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MATCH MODAL */}
            {matchLog && (
                <div style={modalStyle}>
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

            {/* SPLIT MODAL */}
            {splitLog && (
                <div style={modalStyle}>
                    <div className="card" style={{minWidth:'400px'}}>
                        <h3>Split Payment: {splitLog.amount}</h3>
                        <p className="small">Original Sender: {splitLog.sender}</p>
                        
                        <div style={{marginTop:'15px', display:'grid', gap:'10px'}}>
                            {splitAmounts.map((amt, idx) => (
                                <div key={idx} className="flex" style={{gap:'10px', alignItems:'center'}}>
                                    <label className="small">Part {idx+1}: $</label>
                                    <input className="input" placeholder="0.00" value={amt} onChange={e => {
                                        const newAmts = [...splitAmounts];
                                        newAmts[idx] = e.target.value;
                                        setSplitAmounts(newAmts);
                                    }} />
                                </div>
                            ))}
                        </div>
                        <button className="button" style={{marginTop:'10px', fontSize:'0.8rem', backgroundColor:'#64748b'}} onClick={addSplitRow}>+ Add Split</button>

                        <div className="flex" style={{marginTop:'20px', gap:'10px', justifyContent:'flex-end'}}>
                            <button className="button" style={{backgroundColor:'#64748b'}} onClick={()=>setSplitLog(null)}>Cancel</button>
                            <button className="button" onClick={handleSplitSubmit}>Save Splits</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const modalStyle = {
    position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.8)',
    display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000
};