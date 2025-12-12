import React, { useState } from 'react';
import { apiPost } from 'api'; // Clean Import

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await apiPost('/admin/login', { username, password });
            if (response.token) {
                localStorage.setItem('admin_token', response.token);
                window.location.href = "/";
            } else {
                setMessage('Invalid credentials.');
            }
        } catch (error) { setMessage('Login error.'); }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto' }}>
            <h1>Admin Login</h1>
            <div className="card">
                <form onSubmit={handleLogin} style={{ display: 'grid', gap: '15px' }}>
                    <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
                    <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                    <button type="submit" className="button">Log In</button>
                    {message && <p className="small" style={{color: 'red'}}>{message}</p>}
                </form>
            </div>
        </div>
    );
};
export default AdminLogin;