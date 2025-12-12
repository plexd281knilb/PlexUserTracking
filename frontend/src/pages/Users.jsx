import React from 'react';
import { apiPost } from 'api'; // Clean Absolute Import

const Users = () => {
    const users = [
        { id: 1, name: 'Alice Smith', email: 'alice@example.com', plex_username: 'AlicePlex', status: 'Active', due: 0.00 },
        { id: 2, name: 'Bob Johnson', email: 'bob@example.com', plex_username: 'BobbyJ', status: 'Pending', due: 5.00 },
    ];

    const handleImport = async (source) => {
        if (!window.confirm(`Import users from ${source}?`)) return;
        try {
            const endpoint = source === 'plex' ? '/users/import/plex' : '/users/import/tautulli';
            const response = await apiPost(endpoint, {}, localStorage.getItem('admin_token'));
            alert(`Import successful: ${response.users_imported} users found.`);
        } catch (error) {
            alert(`Import failed. Ensure Plex/Tautulli tokens are set in Settings.`);
        }
    };

    return (
        <div>
            <h1>User Management</h1>
            <div className="card">
                <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '15px' }}>
                    <input className="input" type="text" placeholder="Search users..." style={{maxWidth: '300px'}}/>
                    <div className="flex">
                        <button className="button" onClick={() => handleImport('plex')}>Plex Import</button>
                        <button className="button" onClick={() => handleImport('tautulli')}>Tautulli Import</button>
                        <button className="button" style={{backgroundColor: 'var(--accent)'}}>+ Add User</button>
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
                                <td>${user.due.toFixed(2)}</td>
                                <td>
                                    <button className="button" style={{marginRight: '5px', padding: '5px 10px'}}>Edit</button>
                                    <button className="button" style={{backgroundColor: 'red', padding: '5px 10px'}}>Disable</button>
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