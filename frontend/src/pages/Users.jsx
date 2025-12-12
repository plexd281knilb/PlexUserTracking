import React from 'react';
import { apiPost } from '../../api';

const Users = () => {
    // Placeholder Data - ADDED plex_username
    const users = [
        { id: 1, name: 'Alice Smith', email: 'alice@example.com', plex_username: 'AlicePlex', status: 'Active', due: 0.00, last_paid: '2025-12-01' },
        { id: 2, name: 'Bob Johnson', email: 'bob@example.com', plex_username: 'BobbyJ', status: 'Pending', due: 5.00, last_paid: '2025-11-01' },
        { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', plex_username: 'CBrown', status: 'Suspended', due: 25.00, last_paid: '2025-10-01' },
    ];

    const handleImport = async (source) => {
        if (!window.confirm(`Are you sure you want to import users from ${source}? This may overwrite existing user data.`)) return;
        try {
            // Assume endpoints: /api/users/import/plex or /api/users/import/tautulli
            const endpoint = source === 'plex' ? '/api/users/import/plex' : '/api/users/import/tautulli';
            const response = await apiPost(endpoint, {}, localStorage.getItem('admin_token'));
            alert(`Import successful: ${response.users_imported} users processed.`);
            // You would normally call a function to refresh the user list here
        } catch (error) {
            alert(`Import failed. Check logs. Ensure Plex/Tautulli tokens are saved in Settings.`);
            console.error('Import error:', error);
        }
    };

    return (
        <div>
            <h1>User Management</h1>
            <div className="card">
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <input className="input" type="text" placeholder="Search users..." style={{flexGrow: 1, maxWidth: '300px'}}/>
                    
                    <div className="flex">
                        <button className="button" onClick={() => handleImport('plex')} style={{padding: '10px 12px'}}>
                            Import from Plex
                        </button>
                        <button className="button" onClick={() => handleImport('tautulli')} style={{padding: '10px 12px'}}>
                            Import from Tautulli
                        </button>
                        <button className="button" style={{padding: '10px 12px', marginLeft: '10px'}}>Add User</button>
                    </div>
                </div>
                
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Plex Username</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Amount Due</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.plex_username}</td>
                                <td>{user.email}</td>
                                <td><span style={{color: user.status === 'Active' ? 'var(--accent)' : 'red'}}>{user.status}</span></td>
                                <td style={{color: user.due > 0 ? 'red' : 'inherit'}}>${user.due.toFixed(2)}</td>
                                <td>
                                    <button className="button" style={{marginRight: '5px', padding: '6px 8px'}}>Edit</button>
                                    <button className="button" style={{backgroundColor: 'red', padding: '6px 8px'}}>Disable</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;