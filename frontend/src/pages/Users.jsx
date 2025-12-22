import React, { useState, useEffect, useMemo } from 'react';
import { apiGet, apiPost, apiPut } from 'api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    
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

    // --- HELPER: Get Date Object for Sorting/Display ---
    const getPaidDate = (user) => {
        if (user.payment_freq === 'Exempt') return new Date(9999, 11, 31);
        const defaultDate = new Date(2025, 11, 31);

        if (!user.last_paid || user.last_paid === 'Never') {
            if (user.status === 'Active' || user.status === 'Pending') {
                return defaultDate;
            }
            return new Date(0);
        }

        const paidDate = new Date(user.last_paid);
        if (isNaN(paidDate.getTime())) return new Date(0);

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
            } else {
                return defaultDate; // Partial
            }
        } 
        else if (user.payment_freq === 'Monthly' && monthlyFee > 0) {
            const monthsPaid = Math.floor(amountPaid / monthlyFee);
            if (monthsPaid > 0) {
                isValid = true;
                endDate.setMonth(endDate.getMonth() + monthsPaid);
                endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); 
            } else {
                return defaultDate; // Partial
            }
        }

        return isValid ? endDate : defaultDate;
    };

    // --- HELPER: Render Date Badge ---
    const renderPaidThrough = (user) => {
        const date = getPaidDate(user);
        const year = date.getFullYear();

        if (year === 9999) return <span style={{color:'var(--success)', fontWeight:'bold'}}>Forever</span>;
        if (year === 1970) return <span style={{color:'var(--text-muted)'}}>-</span>;
        
        // Highlight Default Date
        const isDefault = year === 2025 && date.getMonth() === 11 && date.getDate() === 31;
        const today = new Date();
        const isExpired = date < today;
        
        const color = isExpired ? 'var(--danger)' : (isDefault ? 'var(--warning)' : 'var(--success)');
        
        return <span style={{color: color, fontWeight:'bold'}}>{date.toISOString().split('T')[0]}</span>;
    };

    // --- SORTING LOGIC ---
    const sortedUsers = useMemo(() => {
        let sortableUsers = [...users];
        if (sortConfig.key !== null) {
            sortableUsers.sort((a, b) => {
                let valA, valB;

                if (sortConfig.key === 'paid_thru') {
                    valA = getPaidDate(a);
                    valB = getPaidDate(b);
                } else {
                    valA = a[sortConfig.key];
                    valB = b[sortConfig.key];
                    
                    if (sortConfig.key === 'last_paid') {
                        if (valA === 'Never' || !valA) valA = '0000-00-00';
                        if (valB === 'Never' || !valB) valB = '0000-00-00';
                    }
                    if (valA === null || valA === undefined) valA = '';
                    if (valB === null || valB === undefined) valB = '';
                    if (typeof valA === 'string') valA = valA.toLowerCase();
                    if (typeof valB === 'string') valB = valB.toLowerCase();
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig, settings]);

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
        switch(freq) { case 'Exempt': return 'btn-warning'; case 'Yearly': return 'btn-secondary'; default: return 'btn-secondary'; }
    };

    return (
        <div className="container">
            <div className="flex-between" style={{marginBottom:'20px'}}>
                <h1>User Management</h1>
                <div className="flex-gap">
                    <button className="button btn-secondary" onClick={handleRemap}>Re-Map Payments</button>
                    <button className="button" onClick={handleSync}>Sync Plex Users</button>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="card flex-between" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <span style={{fontWeight: 'bold'}}>{selectedIds.length} Selected</span>
                    <div className="flex-gap">
                        <button className="button btn-warning" onClick={() => handleBulkUpdate({payment_freq: 'Exempt'})}>Set Exempt</button>
                        <button className="button btn-secondary" onClick={() => handleBulkUpdate({payment_freq: 'Monthly'})}>Set Monthly</button>
                        <button className="button btn-secondary" onClick={() => handleBulkUpdate({payment_freq: 'Yearly'})}>Set Yearly</button>
                        
                        <div className="hide-mobile" style={{width:'1px', height:'20px', backgroundColor:'var(--border)', margin:'0 5px'}}></div>
                        
                        <button className="button btn-success" onClick={() => handleBulkUpdate({status: 'Active'})}>Set Active</button>
                        <button className="button btn-warning" onClick={() => handleBulkUpdate({status: 'Pending'})}>Set Pending</button>
                        <button className="button btn-danger" onClick={() => handleBulkUpdate({status: 'Disabled'})}>Set Disabled</button>
                        
                        <div className="hide-mobile" style={{width:'1px', height:'20px', backgroundColor:'var(--border)', margin:'0 5px'}}></div>

                        <button className="button btn-danger" onClick={handleBulkDelete}>Delete</button>
                    </div>
                </div>
            )}

            <div className="card" style={{padding: 0, overflow: 'hidden'}}>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{width: '40px'}}><input type="checkbox" onChange={handleSelectAll} checked={users.length > 0 && selectedIds.length === users.length} /></th>
                                <th onClick={() => requestSort('username')} style={{cursor:'pointer', userSelect:'none'}}>Username {getSortIcon('username')}</th>
                                <th onClick={() => requestSort('full_name')} style={{cursor:'pointer', userSelect:'none'}}>Full Name {getSortIcon('full_name')}</th>
                                <th onClick={() => requestSort('email')} style={{cursor:'pointer', userSelect:'none'}}>Email {getSortIcon('email')}</th>
                                <th onClick={() => requestSort('payment_freq')} style={{cursor:'pointer', userSelect:'none'}}>Freq {getSortIcon('payment_freq')}</th>
                                <th onClick={() => requestSort('status')} style={{cursor:'pointer', userSelect:'none'}}>Status {getSortIcon('status')}</th>
                                <th onClick={() => requestSort('last_paid')} style={{cursor:'pointer', userSelect:'none'}}>Last Paid {getSortIcon('last_paid')}</th>
                                <th onClick={() => requestSort('paid_thru')} style={{cursor:'pointer', userSelect:'none'}}>Paid Thru {getSortIcon('paid_thru')}</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map(u => (
                                <tr key={u.id} style={{backgroundColor: selectedIds.includes(u.id) ? 'rgba(56, 189, 248, 0.1)' : 'transparent'}}>
                                    <td style={{textAlign: 'center'}}><input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => handleSelectRow(u.id)} /></td>
                                    <td style={{fontWeight:'bold'}}>{u.username}</td>
                                    <td>{u.full_name || '-'}</td>
                                    <td className="small">{u.email}</td>
                                    <td><span className={`button btn-sm ${getFreqBadgeColor(u.payment_freq)}`} style={{cursor:'default'}}>{u.payment_freq || 'Exempt'}</span></td>
                                    <td><span style={{color: u.status === 'Active' ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold'}}>{u.status}</span></td>
                                    <td>{u.last_paid || 'Never'}{u.last_payment_amount && <span style={{marginLeft: '8px', fontSize: '0.75rem', color: 'var(--success)', padding: '2px 5px'}}>({u.last_payment_amount})</span>}</td>
                                    <td>{renderPaidThrough(u)}</td>
                                    <td>
                                        <div className="flex-gap">
                                            <button className="button btn-secondary btn-sm" onClick={() => setEditUser(u)}>Edit</button>
                                            <button className="button btn-warning btn-sm" onClick={() => setMatchUser(u)}>Match</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit User: {editUser.username}</h3>
                        <form onSubmit={handleSaveUser} style={{display:'grid', gap:'15px'}}>
                            <div><label>Full Name</label><input className="input" value={editUser.full_name || ''} onChange={e=>setEditUser({...editUser, full_name: e.target.value})} /></div>
                            <div><label>Email</label><input className="input" value={editUser.email || ''} onChange={e=>setEditUser({...editUser, email: e.target.value})} /></div>
                            <div className="grid-responsive">
                                <div style={{flex:1}}>
                                    <label>Status</label>
                                    <select className="input" value={editUser.status || 'Pending'} onChange={e=>setEditUser({...editUser, status: e.target.value})}>
                                        <option value="Active">Active</option>
                                        <option value="Disabled">Disabled</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                                <div style={{flex:1}}>
                                    <label>Frequency</label>
                                    <select className="input" value={editUser.payment_freq || 'Exempt'} onChange={e=>setEditUser({...editUser, payment_freq: e.target.value})}>
                                        <option value="Exempt">Exempt</option>
                                        <option value="Monthly">Monthly</option>
                                        <option value="Yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                            <div><label>Last Paid</label><input className="input" type="date" value={editUser.last_paid || ''} onChange={e=>setEditUser({...editUser, last_paid: e.target.value})} /></div>
                            <div className="flex-end">
                                <button type="button" className="button btn-secondary" onClick={()=>setEditUser(null)}>Cancel</button>
                                <button type="submit" className="button">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {matchUser && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: '700px'}}>
                        <h3>Match Payment to {matchUser.username}</h3>
                        <div className="table-container" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                            <table className="table">
                                <thead><tr><th>Date</th><th>Sender</th><th>Amount</th><th>Action</th></tr></thead>
                                <tbody>
                                    {logs.map((log, i) => (
                                        <tr key={i} style={{opacity: log.status === 'Matched' ? 0.8 : 1}}>
                                            <td>{log.date}</td>
                                            <td>{log.sender}</td>
                                            <td>{log.amount}</td>
                                            <td>{log.status === 'Matched' ? <button className="button btn-secondary btn-sm" onClick={() => handleUnmap(log)}>Unmap</button> : <button className="button btn-warning btn-sm" onClick={() => handleMatch(log)}>Select</button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex-end" style={{marginTop:'15px'}}>
                            <button className="button btn-secondary" onClick={()=>setMatchUser(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;