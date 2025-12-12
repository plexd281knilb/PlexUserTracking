import React, { useState } from 'react';
import { apiPost } from 'api'; 

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('Logging in...');
        try {
            const response = await apiPost('/admin/login', { username, password });
            if (response.token) {
                localStorage.setItem('admin_token', response.token);
                setMessage('Login successful!');
                window.location.href = "/";
            } else {
                setMessage('Invalid credentials.');
            }
        } catch (error) {
            setMessage('Server error.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto' }}>
            <h1 style={{textAlign: 'center', color: 'var(--accent)'}}>ADMIN LOGIN</h1>
            <div className="card">
                <form onSubmit={handleLogin} style={{ display: 'grid', gap: '20px' }}>
                    <div>
                        <label className="small">Username</label>
                        <input className="input" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div>
                        <label className="small">Password</label>
                        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="button">Login to Tracker</button>
                    {message && <p className="small" style={{textAlign: 'center', color: 'var(--accent)'}}>{message}</p>}
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;