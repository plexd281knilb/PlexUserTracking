import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from 'api'; // Clean Import

const AdminSetup = () => {
    const [isSetupRequired, setIsSetupRequired] = useState(false);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        apiGet('/admin/setup-required').then(r => setIsSetupRequired(r.setup_required)).catch(() => setIsSetupRequired(true));
    }, []);

    const handleSetup = async (e) => {
        e.preventDefault();
        if (password !== confirm) return setMessage('Passwords do not match.');
        try {
            await apiPost('/admin/setup', { password });
            setMessage('Setup complete! Redirecting...');
            window.location.href = "/admin/login";
        } catch (error) { setMessage('Setup failed.'); }
    };

    if (!isSetupRequired) return <div className="card"><h3>System Ready</h3><p>Setup is complete.</p></div>;

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto' }}>
            <h1>Initial Setup</h1>
            <div className="card">
                <form onSubmit={handleSetup} style={{ display: 'grid', gap: '15px' }}>
                    <input className="input" type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <input className="input" type="password" placeholder="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                    <button type="submit" className="button">Initialize</button>
                    {message && <p className="small">{message}</p>}
                </form>
            </div>
        </div>
    );
};
export default AdminSetup;