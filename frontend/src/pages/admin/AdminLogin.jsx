import React, { useState } from 'react';
import { apiPost } from '../api'; // FIXED IMPORT: was ../../api

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
                setMessage('Login successful! Redirecting...');
                // Redirect logic would go here
            } else {
                setMessage('Login failed. Invalid credentials.');
            }
        } catch (error) {
            setMessage('An error occurred during login.');
            console.error('Login error:', error);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto' }}>
            <h1>Admin Login</h1>
            
            <div className="card">
                <form onSubmit={handleLogin} style={{ display: 'grid', gap: '15px' }}>
                    
                    <label className="small">Username</label>
                    <input 
                        className="input" 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="Admin Username" 
                        required 
                    />

                    <label className="small">Password</label>
                    <input 
                        className="input" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Password" 
                        required 
                    />
                    
                    <button type="submit" className="button" style={{ marginTop: '10px' }}>
                        Log In
                    </button>
                    
                    {message && <p className="small" style={{ textAlign: 'center', color: message.includes('successful') ? 'var(--accent)' : 'red' }}>{message}</p>}
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;