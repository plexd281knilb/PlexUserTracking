import React, { useState } from 'react';
import { apiPost } from 'api';

const AdminSetup = () => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');

    const handleSetup = async (e) => {
        e.preventDefault();
        if(password !== confirm) return setMessage("Passwords don't match");
        try {
            await apiPost('/admin/setup', { password });
            setMessage('Setup Complete! Please Login.');
            window.location.href = "/admin/login";
        } catch (error) {
            setMessage('Setup failed.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto' }}>
            <h1>Initial Setup</h1>
            <div className="card">
                <form onSubmit={handleSetup} style={{ display: 'grid', gap: '15px' }}>
                    <input className="input" type="password" placeholder="New Admin Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <input className="input" type="password" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                    <button type="submit" className="button">Initialize System</button>
                    {message && <p className="small">{message}</p>}
                </form>
            </div>
        </div>
    );
};

export default AdminSetup;