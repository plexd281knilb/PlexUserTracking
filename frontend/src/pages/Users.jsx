import React from 'react';

const Users = () => {
    // Placeholder Data
    const users = [
        { id: 1, name: 'Alice Smith', email: 'alice@example.com', status: 'Active', due: 0.00, last_paid: '2025-12-01' },
        { id: 2, name: 'Bob Johnson', email: 'bob@example.com', status: 'Pending', due: 5.00, last_paid: '2025-11-01' },
        { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', status: 'Suspended', due: 25.00, last_paid: '2025-10-01' },
    ];

    return (
        <div>
            <h1>User Management</h1>
            <div className="card">
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <input className="input" type="text" placeholder="Search users..." />
                    <button className="button">Add User</button>
                </div>
                
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Amount Due</th>
                            <th>Last Paid</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td><span style={{color: user.status === 'Active' ? 'var(--accent)' : 'red'}}>{user.status}</span></td>
                                <td style={{color: user.due > 0 ? 'red' : 'inherit'}}>${user.due.toFixed(2)}</td>
                                <td>{user.last_paid}</td>
                                <td>
                                    <button className="button" style={{marginRight: '5px', padding: '6px 8px'}}>Edit</button>
                                    <button className="button" style={{backgroundColor: 'red', padding: '6px 8px'}}>Delete</button>
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