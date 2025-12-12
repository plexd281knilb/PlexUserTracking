import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../api'; // FIXED IMPORT

const AdminSetup = () => {
    const [isSetupRequired, setIsSetupRequired] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const checkSetup = async () => {
            try {
                const response = await apiGet('/admin/setup-required');
                setIsSetupRequired(response.setup_required);
            } catch (error) {
                console.error('Error checking setup status:', error);
                setIsSetupRequired(true); // Default to true if API fails
            }
        };
        checkSetup();
    }, []);

    const handleSetup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setMessage('Password must be at least 8 characters.');
            return;
        }

        setMessage('Starting setup...');
        try {
            const response = await apiPost('/admin/setup', { password });
            if (response.status === 'ok') {
                setMessage('Setup complete! Redirecting to login.');
                setIsSetupRequired(false);
            }
        } catch (error) {
            setMessage('Setup failed. Check server logs.');
            console.error('Setup error:', error);
        }
    };

    if (!isSetupRequired) {
        return (
            <div style={{ maxWidth: '600px', margin: '50px auto' }}>
                <h1 style={{color: 'var(--accent)'}}>Setup Complete</h1>
                <p className="small">The system has already been configured. Please log in.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto' }}>
            <h1>Initial Admin Setup</h1>
            <p className="small">Create the master administrator password for this application.</p>
            
            <div className="card">
                <form onSubmit={handleSetup} style={{ display: 'grid', gap: '15px' }}>
                    
                    <label className="small">New Admin Password</label>
                    <input 
                        className="input" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />

                    <label className="small">Confirm Password</label>
                    <input 
                        className="input" 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required 
                    />
                    
                    <button type="submit" className="button" style={{ marginTop: '10px' }}>
                        Initialize System
                    </button>
                    
                    {message && <p className="small" style={{ textAlign: 'center', color: message.includes('complete') ? 'var(--accent)' : 'red' }}>{message}</p>}
                </form>
            </div>
        </div>
    );
};

export default AdminSetup;