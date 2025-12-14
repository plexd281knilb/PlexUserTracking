import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from 'api';

const SystemSettings = () => {
    const [settings, setSettings] = useState({
        fee_monthly: '',
        fee_yearly: '',
        smtp_host: 'smtp.gmail.com',
        smtp_port: '465',
        smtp_user: '',
        smtp_pass: ''
    });
    const [status, setStatus] = useState('');

    useEffect(() => {
        apiGet('/settings').then(data => {
            // Merge defaults if fields are missing
            setSettings(prev => ({...prev, ...data}));
        });
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setStatus('Saving...');
        try {
            await apiPost('/settings', settings, localStorage.getItem('admin_token'));
            setStatus('Settings Saved!');
            setTimeout(() => setStatus(''), 2000);
        } catch (e) {
            setStatus('Error saving settings');
        }
    };

    return (
        <div className="card">
            <h1>System Settings</h1>
            <form onSubmit={handleSave} style={{maxWidth: '600px'}}>
                
                {/* FEES SECTION */}
                <h3>Subscription Fees</h3>
                <div className="flex" style={{marginBottom: '20px'}}>
                    <div style={{flex: 1}}>
                        <label className="small">Monthly Fee ($)</label>
                        <input className="input" type="number" step="0.01" 
                            value={settings.fee_monthly} 
                            onChange={e => setSettings({...settings, fee_monthly: e.target.value})} 
                        />
                    </div>
                    <div style={{flex: 1}}>
                        <label className="small">Yearly Fee ($)</label>
                        <input className="input" type="number" step="0.01" 
                            value={settings.fee_yearly} 
                            onChange={e => setSettings({...settings, fee_yearly: e.target.value})} 
                        />
                    </div>
                </div>

                <hr style={{borderColor: 'var(--border)', margin: '20px 0'}} />

                {/* EMAIL SECTION */}
                <h3>Email Notifications (SMTP)</h3>
                <p className="small" style={{marginBottom: '15px'}}>Required for automated reminders.</p>
                
                <div style={{marginBottom: '15px'}}>
                    <label className="small">SMTP Host</label>
                    <input className="input" placeholder="e.g. smtp.gmail.com" 
                        value={settings.smtp_host || ''} 
                        onChange={e => setSettings({...settings, smtp_host: e.target.value})} 
                    />
                </div>

                <div className="flex" style={{marginBottom: '15px'}}>
                    <div style={{flex: 1}}>
                        <label className="small">Port</label>
                        <input className="input" placeholder="465" 
                            value={settings.smtp_port || ''} 
                            onChange={e => setSettings({...settings, smtp_port: e.target.value})} 
                        />
                    </div>
                    <div style={{flex: 2}}>
                        <label className="small">Email Address (Sender)</label>
                        <input className="input" placeholder="alerts@example.com" 
                            value={settings.smtp_user || ''} 
                            onChange={e => setSettings({...settings, smtp_user: e.target.value})} 
                        />
                    </div>
                </div>

                <div style={{marginBottom: '20px'}}>
                    <label className="small">Password / App Password</label>
                    <input className="input" type="password" 
                        value={settings.smtp_pass || ''} 
                        onChange={e => setSettings({...settings, smtp_pass: e.target.value})} 
                    />
                    <p className="small" style={{marginTop:'5px', color:'var(--text-muted)'}}>
                        Note: For Gmail, use an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>App Password</a>.
                    </p>
                </div>

                <button type="submit" className="button">Save Settings</button>
                {status && <span style={{marginLeft: '15px', color: '#10b981'}}>{status}</span>}
            </form>
        </div>
    );
};

export default SystemSettings;