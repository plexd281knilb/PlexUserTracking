import React, { useState, useEffect, useMemo } from 'react';
import { apiGet, apiPost, apiPut } from 'api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Sort Configuration
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    
    const [selectedIds, setSelectedIds] = useState([]);
    const [editUser, setEditUser] = useState(null);
    const [matchUser, setMatchUser] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [uData, lData, sData] = await Promise.all([
                apiGet('/users'),
                apiGet('/payment_logs'),
                apiGet('/settings')
            ]);
            setUsers(uData);
            setLogs(lData); 
            setSettings(sData || {});
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- SORTING LOGIC ---
    const sortedUsers = useMemo(() => {
        let sortableUsers = [...users];
        if (sortConfig.key !== null) {
            sortableUsers.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                // Handle 'last_paid' specifically to sort 'Never' correctly
                if (sortConfig.key === 'last_paid') {
                    if (valA === 'Never' || !valA) valA = '0000-00-00';
                    if (valB === 'Never' || !valB) valB = '0000-00-00';
                }

                // Null safety
                if (valA === null || valA === undefined) valA = '';
                if (valB === null || valB === undefined) valB = '';

                // Case-insensitive string sorting
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <span style={{opacity:0.3, fontSize:'0.8em', marginLeft:'5px'}}>↕</span>;
        return <span style={{fontSize:'0.8em', marginLeft:'5px'}}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    // --- HELPER: Calculate Paid Through Date ---
    const calculatePaidThrough = (user) => {
        if (user.payment_freq === 'Exempt') return <span style={{color:'#10b981', fontWeight:'bold'}}>Forever</span>;
        
        if ((!user.last_paid || user.last_paid === 'Never')) {
            if (user.status === 'Active' || user.status === 'Pending') {
                return <span style={{color:'#f59e0b'}}>2025-12-31 (Default)</span>;
            }
            return <span style={{color:'#94a3b8'}}>-</span>;
        }

        const paidDate = new Date(user.last_paid);
        if (isNaN(paidDate.getTime())) return <span style={{color:'#94a3b8'}}>Invalid Date</span>;

        const amountPaid = parseFloat((user.last_payment_amount || '0').replace(/[^0-9.]/g, ''));
        const monthlyFee = parseFloat(settings.fee_monthly || 0);
        const yearlyFee = parseFloat(settings.fee_yearly || 0);

        let endDate = new Date(paidDate);
        let isValid = false;

        if (user.payment_freq === 'Yearly' && yearlyFee > 0) {
            const yearsPaid = Math.floor(amountPaid / yearlyFee);
            if (yearsPaid > 0) {
                isValid = true;
                endDate.setFullYear(endDate.getFullYear() + yearsPaid);
                endDate.setMonth(11); 
                endDate.setDate(31);  
            }
        } 
        else if (user.payment_freq === 'Monthly' && monthlyFee > 0) {
            const monthsPaid = Math.floor(amountPaid / monthlyFee);
            if (monthsPaid > 0) {
                isValid = true;
                endDate.setMonth(endDate.getMonth() + monthsPaid);
                endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); 
            }
        }

        if (!isValid) return <span style={{color:'#f59e0b', fontSize:'0.8em'}}>Partial Payment</span>;

        const today = new Date();
        const isExpired = endDate < today;
        return <span style={{color: isExpired ? '#ef4444' : '#10b981', fontWeight:'bold'}}>{endDate.toISOString().split('T')[0]}</span>;
    };

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
        if (!window.confirm(`PERMANENTLY DELETE ${selectedIds.length} users? This cannot be undone.`)) return;
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

    const handleMatch = async (log) => {
        if(!window.confirm(`Link payment of ${log.amount} to ${matchUser.username}?`)) return;
        await apiPost(`/users/${matchUser.id}/match_payment`, {
            date: log.date, raw_text: log.raw_text, amount: log.amount, sender: log.sender
        }, localStorage.getItem('admin_token'));
        setMatchUser(null);
        fetchData();
    };

    const handleUnmap = async (log) => {
        if(!window.confirm(`Unlink this payment?`)) return;
        await apiPost(`/users/unmap_payment`, { date: log.date, raw_text: log.raw_text }, localStorage.getItem('admin_token'));
        setMatchUser(null);
        fetchData();
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            const res = await apiPost(`/users/import/plex`, {}, localStorage.getItem('admin_token'));
            alert(res.message); fetchData();
        } catch (e) { alert('Sync failed.'); }
        setLoading(false);
    };

    const handleRemap = async () => {
        setLoading(true);
        try {
            const res = await apiPost('/payments/remap', {}, localStorage.getItem('admin_token'));
            alert(res.message); fetchData();
        } catch (e) { alert('Remap failed'); }
        setLoading(false);
    };

    const getFreqBadgeColor = (freq) => {
        switch(freq) { case 'Exempt': return '#eab308'; case 'Yearly': return '#8b5cf6'; default: return '#64748b'; }
    };

    return (
        <div>
            <div className="flex" style={{justifyContent:'space-between', alignItems:'center'}}>
                <h1>User Management</h1>
                <div className="flex" style={{gap: '10px'}}>
                    <button className="button" style={{backgroundColor: '#64748b'}} onClick={handleRemap}>🔄 Re-Map Payments</button>
                    <button className="button" onClick={handleSync}>Sync Plex Users</button>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="card" style={{backgroundColor: '#334155', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderLeft: '4px solid #38bdf8'}}>
                    <span style={{fontWeight: 'bold', color: 'white'}}>{selectedIds.length} Selected</span>
                    <div className="flex" style={{gap: '10px', flexWrap:'wrap'}}>
                        <button className="button" style={{fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#eab308', color: 'black'}} onClick={() => handleBulkUpdate({payment_freq: 'Exempt'})}>Set Exempt</button>
                        <button className="button" style={{fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#64748b'}} onClick={() => handleBulkUpdate({payment_freq: 'Monthly'})}>Set Monthly</button>
                        <button className="button" style={{fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#8b5cf6'}} onClick={() => handleBulkUpdate({payment_freq: 'Yearly'})}>Set Yearly</button>
                        <button className="button" style={{fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#ef4444'}} onClick={() => handleBulkUpdate({status: 'Disabled'})}>Disable All</button>
                        <button className="button" style={{fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#b91c1c'}} onClick={handleBulkDelete}>Delete Selected</button>
                    </div>
                </div>
            )}

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{width: '40px'}}><input type="checkbox" onChange={handleSelectAll} checked={users.length > 0 && selectedIds.length === users.length} /></th>
                            <th onClick={() => requestSort('username')} style={{cursor:'pointer', userSelect:'none'}}>Username {getSortIcon('username')}</th>
                            <th onClick={() => requestSort('full_name')} style={{cursor:'pointer', userSelect:'none'}}>Full Name {getSortIcon('full_name')}</th>
                            <th onClick={() => requestSort('email')} style={{cursor:'pointer', userSelect:'none'}}>Email {getSortIcon('email')}</th>
                            <th onClick={() => requestSort('payment_freq')} style={{cursor:'pointer', userSelect:'none'}}>Frequency {getSortIcon('payment_freq')}</th>
                            <th onClick={() => requestSort('status')} style={{cursor:'pointer', userSelect:'none'}}>Status {getSortIcon('status')}</th>
                            <th onClick={() => requestSort('last_paid')} style={{cursor:'pointer', userSelect:'none'}}>Last Paid {getSortIcon('last_paid')}</th>
                            <th>Paid Thru</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.map(u => (
                            <tr key={u.id} style={{backgroundColor: selectedIds.includes(u.id) ? 'rgba(56, 189, 248, 0.1)' : 'transparent'}}>
                                <td style={{textAlign: 'center'}}><input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => handleSelectRow(u.id)} /></td>
                                <td style={{fontWeight:'bold'}}>{u.username}</td>
                                <td>{u.full_name || '-'}</td>
                                <td style={{fontSize:'0.85rem', color:'#94a3b8'}}>{u.email}</td>
                                <td><span style={{fontSize:'0.75rem', padding:'2px 6px', borderRadius:'4px', backgroundColor: getFreqBadgeColor(u.payment_freq), color: u.payment_freq === 'Exempt' ? 'black' : 'white', fontWeight: 'bold'}}>{u.payment_freq || 'Exempt'}</span></td>
                                <td><span style={{color: u.status === 'Active' ? '#10b981' : '#ef4444', fontWeight: 'bold'}}>{u.status}</span></td>
                                <td>{u.last_paid || 'Never'}{u.last_payment_amount && <span style={{marginLeft: '8px', fontSize: '0.75rem', color: '#10b981', padding: '2px 5px'}}>({u.last_payment_amount})</span>}</td>
                                <td>{calculatePaidThrough(u)}</td>
                                <td>
                                    <div className="flex" style={{gap:'5px'}}>
                                        <button className="button" style={{padding:'4px 8px', fontSize:'0.75rem'}} onClick={() => setEditUser(u)}>Edit</button>
                                        <button className="button" style={{padding:'4px 8px', fontSize:'0.75rem', backgroundColor: '#f59e0b'}} onClick={() => setMatchUser(u)}>Match</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editUser && (
                <div style={modalStyle}>
                    <div className="card" style={{minWidth: '400px', margin: 'auto'}}>
                        <h3>Edit User: {editUser.username}</h3>
                        <form onSubmit={handleSaveUser} style={{display:'grid', gap:'15px'}}>
                            <div><label className="small">Full Name</label><input className="input" value={editUser.full_name || ''} onChange={e=>setEditUser({...editUser, full_name: e.target.value})} /></div>
                            <div><label className="small">Email</label><input className="input" value={editUser.email || ''} onChange={e=>setEditUser({...editUser, email: e.target.value})} /></div>
                            <div className="flex" style={{gap:'10px'}}>
                                <div style={{flex:1}}>
                                    <label className="small">Status</label>
                                    <select className="input" value={editUser.status || 'Pending'} onChange={e=>setEditUser({...editUser, status: e.target.value})}>
                                        <option value="Active">Active</option>
                                        <option value="Disabled">Disabled</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                                <div style={{flex:1}}>
                                    <label className="small">Frequency</label>
                                    <select className="input" value={editUser.payment_freq || 'Exempt'} onChange={e=>setEditUser({...editUser, payment_freq: e.target.value})}>
                                        <option value="Exempt">Exempt</option>
                                        <option value="Monthly">Monthly</option>
                                        <option value="Yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                            <div><label className="small">Last Paid</label><input className="input" type="date" value={editUser.last_paid || ''} onChange={e=>setEditUser({...editUser, last_paid: e.target.value})} /></div>
                            <div className="flex" style={{justifyContent:'flex-end'}}>
                                <button type="button" className="button" style={{backgroundColor:'#64748b', marginRight:'10px'}} onClick={()=>setEditUser(null)}>Cancel</button>
                                <button type="submit" className="button">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {matchUser && (
                <div style={modalStyle}>
                    <div className="card" style={{minWidth: '600px', maxHeight: '80vh', overflowY: 'auto', margin: 'auto'}}>
                        <h3>Match Payment to {matchUser.username}</h3>
                        <table className="table" style={{marginTop:'15px'}}>
                            <thead><tr><th>Date</th><th>Sender</th><th>Amount</th><th>Action</th></tr></thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={i} style={{opacity: log.status === 'Matched' ? 0.8 : 1}}>
                                        <td>{log.date}</td>
                                        <td>{log.sender}</td>
                                        <td>{log.amount}</td>
                                        <td>{log.status === 'Matched' ? <button className="button" style={{padding:'2px', backgroundColor:'#64748b'}} onClick={() => handleUnmap(log)}>Unmap</button> : <button className="button" style={{padding:'2px'}} onClick={() => handleMatch(log)}>Select</button>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="button" style={{backgroundColor:'#64748b', marginTop:'15px'}} onClick={()=>setMatchUser(null)}>Close</button>
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