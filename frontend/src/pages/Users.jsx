import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from 'api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedIds, setSelectedIds] = useState([]);
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
            setLogs(lData); 
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- HANDLERS ---
    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(users.map(u => u.id));
        else setSelectedIds([]);
    };

    const handleSelectRow = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    const handleBulkUpdate = async (updates) => {
        if (!window.confirm(`Update ${selectedIds.length} users?`)) return;
        try {
            await apiPut('/users/bulk', { ids: selectedIds, updates }, localStorage.getItem('admin_token'));
            setSelectedIds([]); 
            fetchData(); 
        } catch (e) { alert('Bulk update failed.'); }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`DELETE ${selectedIds.length} users? This cannot be undone.`)) return;
        try {
            await apiPost('/users/bulk/delete', { ids: selectedIds }, localStorage.getItem('admin_token'));
            setSelectedIds([]); 
            fetchData(); 
        } catch (e) { alert('Bulk delete failed.'); }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        await apiPut(`/users/${editUser.id}`, editUser, localStorage.getItem('admin_token'));
        setEditUser(null);
        fetchData();
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Delete this user? You can re-import them from Plex.")) return;
        await apiDelete(`/users/${id}`, localStorage.getItem('admin_token'));
        fetchData();
    };

    const handleMatch = async (log) => {
        if(!window.confirm(`Link payment of ${log.amount} from ${log.sender} to ${matchUser.username}?`)) return;
        await apiPost(`/users/${matchUser.id}/match_payment`, {
            date: log.date,
            raw_text: log.raw_text,
            amount: log.amount,
            sender: log.sender
        }, localStorage.getItem('admin_token'));
        setMatchUser(null);
        fetchData();
    };

    const handleUnmap = async (log) => {
        if(!window.confirm(`Unlink this payment?`)) return;
        await apiPost(`/users/unmap_payment`, {
            date: log.date,
            raw_text: log.raw_text
        }, localStorage.getItem('admin_token'));
        setMatchUser(null);
        fetchData();
    };

    const toggleStatus = async (user) => {
        if (user.status === 'Active' && user.payment_freq === 'Exempt') {
            alert("This user is Exempt and cannot be disabled.");
            return;
        }
        const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
        if(!window.confirm(`Mark ${user.username} as ${newStatus}?`)) return;
        await apiPut(`/users/${user.id}`, { ...user, status: newStatus }, localStorage.getItem('admin_token'));
        fetchData();
    };

    const handleImportPlex = async () => {
        setLoading(true);
        try {
            const res = await apiPost(`/users/import/plex`, {}, localStorage.getItem('admin_token'));
            alert(res.message);
            fetchData();
        } catch (e) { alert('Import failed.'); }
        setLoading(false);
    };

    const handleRemap = async () => {
        if (!window.confirm("Re-scan all unmapped payments against current users?")) return;
        setLoading(true);
        try {
            const res = await apiPost('/payments/remap', {}, localStorage.getItem('admin_token'));
            alert(res.message);
            fetchData();
        } catch (e) { alert('Remap failed'); }
        setLoading(false);
    };

    const getFreqBadgeColor = (freq) => {
        switch(freq) {
            case 'Exempt': return '#eab308';
            case 'Yearly': return '#8b5cf6';
            default: return '#64748b';
        }
    };

    return (
        <div>
            <div className="flex" style={{justifyContent:'space-between', alignItems:'center'}}>
                <h1>User Management</h1>
                <div className="flex" style={{gap: '10px'}}>
                    <button className="button" style={{backgroundColor: '#64748b'}} onClick={handleRemap}>🔄 Re-Map Payments</button>
                    <button className="button" onClick={handleImportPlex}>Import Plex Users</button>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="card" style={{backgroundColor: '#334155', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderLeft: '4px solid #38bdf8'}}>
                    <span style={{fontWeight: 'bold', color: 'white'}}>{selectedIds.length} Selected</span>
                    <div style={{height: '20px', width: '1px', backgroundColor: '#94a3b8'}}></div>
                    <button className="button" style={{fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#eab308', color: 'black'}} onClick={() => handleBulkUpdate({payment_freq: 'Exempt'})}>Set Exempt</button>
                    <button className="button" style={{fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#64748b'}} onClick={() => handleBulkUpdate({payment_freq: 'Monthly'})}>Set Monthly</button>
                    <button className="button" style={{fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#8b5cf6'}} onClick={() => handleBulkUpdate({payment_freq: 'Yearly'})}>Set Yearly</button>
                    <div style={{height: '20px', width: '1px', backgroundColor: '#94a3b8'}}></div>
                    <button className="button" style={{fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#10b981'}} onClick={() => handleBulkUpdate({status: 'Active'})}>Enable</button>
                    <button className="button" style={{fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#ef4444'}} onClick={() => handleBulkUpdate({status: 'Disabled'})}>Disable</button>
                    <div style={{height: '20px', width: '1px', backgroundColor: '#94a3b8'}}></div>
                    <button className="button" style={{fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#ef4444'}} onClick={handleBulkDelete}>Delete Selected</button>
                </div>
            )}

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{width: '40px', textAlign: 'center'}}><input type="checkbox" onChange={handleSelectAll} checked={users.length > 0 && selectedIds.length === users.length} style={{cursor: 'pointer'}} /></th>
                            <th>Username</th>
                            <th>Full Name</th>
                            <th>Frequency</th>
                            <th>Status (Access)</th>
                            <th>Last Paid (Amount)</th>
                            <th style={{width: '220px'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{backgroundColor: selectedIds.includes(u.id) ? 'rgba(56, 189, 248, 0.1)' : 'transparent'}}>
                                <td style={{textAlign: 'center'}}><input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => handleSelectRow(u.id)} style={{cursor: 'pointer'}} /></td>
                                <td style={{fontWeight:'bold'}}>{u.username}</td>
                                <td>{u.full_name || '-'}</td>
                                <td><span style={{fontSize:'0.75rem', padding:'2px 6px', borderRadius:'4px', backgroundColor: getFreqBadgeColor(u.payment_freq), color: u.payment_freq === 'Exempt' ? 'black' : 'white', fontWeight: 'bold'}}>{u.payment_freq || 'Exempt'}</span></td>
                                <td><span style={{color: u.status === 'Active' ? '#10b981' : '#ef4444', fontWeight: 'bold'}}>{u.status}</span></td>
                                <td>{u.last_paid || 'Never'}{u.last_payment_amount && <span style={{marginLeft: '8px', fontSize: '0.75rem', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 5px', borderRadius: '4px'}}>({u.last_payment_amount})</span>}</td>
                                <td>
                                    <div className="flex" style={{gap:'5px'}}>
                                        <button className="button" style={{padding:'4px 8px', fontSize:'0.75rem'}} onClick={() => setEditUser(u)}>Edit</button>
                                        <button className="button" style={{padding:'4px 8px', fontSize:'0.75rem', backgroundColor: '#f59e0b'}} onClick={() => setMatchUser(u)}>Match</button>
                                        <button className="button" style={{padding:'4px 8px', fontSize:'0.75rem', backgroundColor: u.status==='Active' ? '#ef4444' : '#10b981', opacity: u.payment_freq === 'Exempt' && u.status === 'Active' ? 0.5 : 1}} onClick={() => toggleStatus(u)}>{u.status==='Active' ? 'Disable' : 'Enable'}</button>
                                        <button className="button" style={{padding:'4px 8px', fontSize:'0.75rem', backgroundColor: '#dc2626'}} onClick={() => handleDeleteUser(u.id)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal (Keeping Same) */}
            {editUser && (
                <div style={modalStyle}>
                    <div className="card" style={{minWidth: '400px', margin: 'auto'}}>
                        <h3>Edit User: {editUser.username}</h3>
                        <form onSubmit={handleSaveUser} style={{display:'grid', gap:'15px'}}>
                            <div><label className="small">Full Name</label><input className="input" value={editUser.full_name || ''} onChange={e=>setEditUser({...editUser, full_name: e.target.value})} /></div>
                            <div><label className="small">AKA / Aliases</label><input className="input" value={editUser.aka || ''} onChange={e=>setEditUser({...editUser, aka: e.target.value})} /></div>
                            <div><label className="small">Email</label><input className="input" value={editUser.email || ''} onChange={e=>setEditUser({...editUser, email: e.target.value})} /></div>
                            <div>
                                <label className="small">Last Paid Date (YYYY-MM-DD)</label>
                                <input className="input" type="date" value={editUser.last_paid || ''} onChange={e=>setEditUser({...editUser, last_paid: e.target.value})} />
                            </div>
                            <div>
                                <label className="small">Payment Frequency</label>
                                <select className="input" value={editUser.payment_freq || 'Exempt'} onChange={e=>setEditUser({...editUser, payment_freq: e.target.value})}>
                                    <option value="Exempt">Exempt</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
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

            {/* Match Modal (Keeping Same) */}
            {matchUser && (
                <div style={modalStyle}>
                    <div className="card" style={{minWidth: '600px', maxHeight: '80vh', overflowY: 'auto', margin: 'auto'}}>
                        <h3>Match Payment to {matchUser.username}</h3>
                        <p className="small">Select a transaction below:</p>
                        <table className="table" style={{marginTop:'15px'}}>
                            <thead><tr><th>Date</th><th>Sender</th><th>Amount</th><th>Action</th></tr></thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={i} style={{opacity: log.status === 'Matched' ? 0.8 : 1}}>
                                        <td>{log.date}</td>
                                        <td>{log.sender}</td>
                                        <td>{log.amount}</td>
                                        <td>
                                            {log.status === 'Matched' ? (
                                                <div className="flex" style={{gap: '5px'}}>
                                                    <span className="small" style={{color: '#10b981', alignSelf:'center'}}>{log.mapped_user}</span>
                                                    <button className="button" style={{padding:'2px 8px', fontSize:'0.7rem', backgroundColor: '#64748b'}} onClick={() => handleUnmap(log)}>Unmap</button>
                                                </div>
                                            ) : (
                                                <button className="button" style={{padding:'2px 8px', fontSize:'0.7rem'}} onClick={() => handleMatch(log)}>Select</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>No payments found.</td></tr>}
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