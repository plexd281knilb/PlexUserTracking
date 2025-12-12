import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from 'api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch real users from backend on load
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await apiGet('/users');
            setUsers(data);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleImport = async (source) => {
        if (!window.confirm(`Import users from ${source}? This may update existing records.`)) return;
        try {
            const res = await apiPost(`/users/import/${source}`, {}, localStorage.getItem('admin_token'));
            alert(res.message || `Import successful!`);
            fetchUsers(); // Refresh list after import
        } catch (e) { alert('Import failed. Check Settings.'); }
    };

    return (
        <div>
            <h1>User Management</h1>
            <div className="card">
                <div className="flex" style={{justifyContent: 'space-between', marginBottom: '20px'}}>
                    <input className="input" placeholder="Search users..." style={{maxWidth: '300px', marginTop:0}} />
                    <div className="flex">
                        <button className="button" onClick={() => handleImport('plex')}>Import Plex</button>
                        <button className="button" onClick={() => handleImport('tautulli')}>Import Tautulli</button>
                    </div>
                </div>
                
                {isLoading ? <p>Loading users...</p> : (
                    <table className="table">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Status</th><th>Last Paid</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
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
                                        <button className="button" style={{padding:'5px 10px', fontSize:'0.8rem', backgroundColor: 'var(--bg-input)'}}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No users found. Try importing from Plex.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
export default Users;