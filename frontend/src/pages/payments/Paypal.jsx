import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "api";

export default function Paypal() {
    const [accounts, setAccounts] = useState([]);
    const [newAccount, setNewAccount] = useState({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchAccounts = () => apiGet("/payments/accounts/paypal").then(setAccounts);

    useEffect(() => { fetchAccounts(); }, []);

    const handleAdd = async () => {
        setStatus('Testing Connection...');
        try {
            await apiPost("/payments/accounts/paypal", newAccount, localStorage.getItem('admin_token'));
            setNewAccount({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
            setStatus('');
            fetchAccounts();
            alert("Connected successfully!");
        } catch (e) {
            setStatus('Connection Failed');
            alert(`Failed: ${e.message || 'Check credentials'}`);
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Remove this account?")) return;
        await apiDelete(`/payments/accounts/paypal/${id}`, localStorage.getItem('admin_token'));
        fetchAccounts();
    };

    const handleScan = async () => {
        setLoading(true);
        try {
            const res = await apiPost("/payments/scan/paypal", {}, localStorage.getItem('admin_token'));
            alert(res.message);
            fetchAccounts();
        } catch (e) { alert("Scan failed"); }
        setLoading(false);
    };

    return (
        <div className="card">
            <div className="flex" style={{justifyContent:'space-between', alignItems:'center'}}>
                <h3>PayPal Scanners</h3>
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
        </div>
    );
}