import React from 'react';
// Assuming Users component calls backend API to fetch user list

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
            <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <input type="text" placeholder="Search users..." />
                    <button className="btn-primary">Add User</button>
                </div>
                
                <table>
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
                                <td><span style={{color: user.status === 'Active' ? 'green' : 'red'}}>{user.status}</span></td>
                                <td style={{color: user.due > 0 ? 'red' : 'inherit'}}>${user.due.toFixed(2)}</td>
                                <td>{user.last_paid}</td>
                                <td><button className="btn-primary" style={{marginRight: '5px'}}>Edit</button><button className="btn-primary" style={{backgroundColor: 'red'}}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;