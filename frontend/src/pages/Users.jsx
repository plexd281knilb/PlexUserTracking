import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from 'api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modals State
    const [editUser, setEditUser] = useState(null);
    const [matchUser, setMatchUser] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [uData, lData] = await Promise.all([
                apiGet('/users'),
                apiGet('/payment_logs')
            ]);
            setUsers(uData);
            setLogs(lData.filter(l => l.status === 'Unmapped'));
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- ACTIONS ---

    const handleSaveUser = async (e) => {
        e.preventDefault();
        await apiPut(`/users/${editUser.id}`, editUser, localStorage.getItem('admin_token'));
        setEditUser(null);
        fetchData();
    };

    const handleMatch = async (log) => {
        if(!window.confirm(`Link payment of ${log.amount} from ${log.sender} to ${matchUser.username}?`)) return;
        await apiPost(`/users/${matchUser.id}/match_payment`, {
            date: log.date,
            raw_text: log.raw_text
        }, localStorage.getItem('admin_token'));
        setMatchUser(null);
        fetchData();
    };

    const toggleStatus = async (user) => {
        // Prevent disabling exempt users via UI
        if (user.status === 'Active' && user.payment_freq === 'Exempt') {
            alert("This user is Exempt and cannot be disabled.");
            return;
        }

        const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
        if(!window.confirm(`Mark ${user.username} as ${newStatus}?\n(This will attempt to update Plex access)`)) return;
        await apiPut(`/users/${user.id}`, { ...user, status: newStatus }, localStorage.getItem('admin_token'));
        fetchData();
    };

    const handleImport = async (source) => {
        if (!window.confirm(`Import from ${source}?`)) return;
        setLoading(true);
        try {
            const res = await apiPost(`/users/import/${source}`, {}, localStorage.getItem('admin_token'));
            alert(res.message);
            fetchData();
        } catch (e) { alert('Import failed.'); }
        setLoading(false);
    };

    // Helper to get badge color
    const getFreqBadgeColor = (freq) => {
        switch(freq) {
            case 'Exempt': return '#eab308'; // Gold
            case 'Yearly': return '#8b5cf6'; // Purple
            default: return '#64748b';       // Grey (Monthly)
        }
    };

    return (
        <div>
            <div className="flex" style={{justifyContent:'space-between', alignItems:'center'}}>
                <h1>User Management</h1>
                <div className="flex">
                    <button className="button" onClick={() => handleImport('plex')}>Import Plex</button>
                    <button className="button" onClick={() => handleImport('tautulli')}>Import Tautulli</button>
                </div>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Frequency</th>
                            <th>Status (Access)</th>
                            <th>Last Paid</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td style={{fontWeight:'bold'}}>{u.username}</td>
                                <td>{u.full_name || '-'}</td>
                                <td className="small">{u.email}</td>
                                <td>
                                    <span style={{
                                        fontSize:'0.75rem', padding:'2px 6px', borderRadius:'4px',
                                        backgroundColor: getFreqBadgeColor(u.payment_freq),
                                        color: u.payment_freq === 'Exempt' ? 'black' : 'white',
                                        fontWeight: 'bold'
                                    }}>
                                        {u.payment_freq || 'Monthly'}
                                    </span>
                                </td>
                                <td>
                                    <span style={{
                                        color: u.status === 'Active' ? '#10b981' : '#ef4444', 
                                        fontWeight: 'bold'
                                    }}>
                                        {u.status}
                                    </span>
                                </td>
                                <td>{u.last_paid || 'Never'}</td>
                                <td>
                                    <div className="flex" style={{gap:'5px'}}>
                                        <button className="button" style={{padding:'4px 8px', fontSize:'0.75rem'}} 
                                            onClick={() => setEditUser(u)}>
                                            Edit
                                        </button>
                                        <button className="button" style={{padding:'4px 8px', fontSize:'0.75rem', backgroundColor: '#f59e0b'}} 
                                            onClick={() => setMatchUser(u)}>
                                            Match Pay
                                        </button>
                                        <button className="button" 
                                            style={{
                                                padding:'4px 8px', fontSize:'0.75rem', 
                                                backgroundColor: u.status==='Active' ? '#ef4444' : '#10b981',
                                                opacity: u.payment_freq === 'Exempt' && u.status === 'Active' ? 0.5 : 1
                                            }} 
                                            onClick={() => toggleStatus(u)}>
                                            {u.status==='Active' ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* EDIT USER MODAL */}
            {editUser && (
                <div style={modalStyle}>
                    <div className="card" style={{minWidth: '400px', margin: 'auto'}}>
                        <h3>Edit User: {editUser.username}</h3>
                        <form onSubmit={handleSaveUser} style={{display:'grid', gap:'15px'}}>
                            <div>
                                <label className="small">Full Name</label>
                                <input className="input" value={editUser.full_name || ''} 
                                    onChange={e=>setEditUser({...editUser, full_name: e.target.value})} />
                            </div>
                            
                            <div>
                                <label className="small">AKA / Aliases (Comma separated)</label>
                                <input className="input" placeholder="e.g. Bobby, Big Bob" value={editUser.aka || ''} 
                                    onChange={e=>setEditUser({...editUser, aka: e.target.value})} />
                                <p className="small" style={{marginTop:'5px', fontSize:'0.7rem', color: 'var(--text-muted)'}}>
                                    Used to match Venmo/Zelle names if they differ from Plex.
                                </p>
                            </div>

                            <div>
                                <label className="small">Email</label>
                                <input className="input" value={editUser.email || ''} 
                                    onChange={e=>setEditUser({...editUser, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="small">Payment Frequency</label>
                                <select className="input" value={editUser.payment_freq || 'Monthly'}
                                    onChange={e=>setEditUser({...editUser, payment_freq: e.target.value})}>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                    <option value="Exempt">Exempt (Do Not Disable)</option>
                                </select>
                            </div>
                            <div className="flex" style={{justifyContent:'flex-end'}}>
                                <button type="button" className="button" style={{backgroundColor:'#64748b', marginRight:'10px'}} onClick={()=>setEditUser(null)}>Cancel</button>
                                <button type="submit" className="button">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MATCH PAYMENT MODAL */}
            {matchUser && (
                <div style={modalStyle}>
                    <div className="card" style={{minWidth: '500px', maxHeight: '80vh', overflowY: 'auto', margin: 'auto'}}>
                        <h3>Match Payment to {matchUser.username}</h3>
                        <p className="small">Select a recent unmapped transaction below:</p>
                        
                        <table className="table" style={{marginTop:'15px'}}>
                            <thead><tr><th>Date</th><th>Sender</th><th>Amount</th><th>Action</th></tr></thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={i}>
                                        <td>{log.date}</td>
                                        <td>{log.sender}</td>
                                        <td>{log.amount}</td>
                                        <td>
                                            <button className="button" style={{padding:'2px 8px', fontSize:'0.7rem'}} 
                                                onClick={() => handleMatch(log)}>
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>No unmapped payments found.</td></tr>}
                            </tbody>
                        </table>
                        
                        <div style={{marginTop:'20px', textAlign:'right'}}>
                            <button className="button" style={{backgroundColor:'#64748b'}} onClick={()=>setMatchUser(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const modalStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
};

export default Users;