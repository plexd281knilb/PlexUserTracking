import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from 'api';

const Settings = () => {
    const [settings, setSettings] = useState({
        fee_monthly: "0.00",
        fee_yearly: "0.00",
        plex_auto_ban: true,
        plex_auto_invite: true,
        venmo_search_term: '',
        paypal_search_term: '',
        zelle_search_term: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet('/settings')
            .then(data => {
                setSettings(prev => ({ ...prev, ...data }));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        try {
            await apiPost('/settings', settings, localStorage.getItem('admin_token'));
            alert('Settings Saved Successfully');
        } catch (e) {
            alert('Failed to save settings');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1>System Settings</h1>

            {/* SUBSCRIPTION FEES */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>Subscription Costs</h3>
                <p className="small" style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
                    Set the standard amount users are expected to pay. This helps track who has paid in full.
                </p>
                <div className="flex" style={{ gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label className="small">Monthly Fee ($)</label>
                        <input 
                            className="input" 
                            name="fee_monthly" 
                            value={settings.fee_monthly} 
                            onChange={handleChange} 
                            placeholder="0.00"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="small">Yearly Fee ($)</label>
                        <input 
                            className="input" 
                            name="fee_yearly" 
                            value={settings.fee_yearly} 
                            onChange={handleChange} 
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>

            {/* PLEX AUTOMATION */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>Plex Automation</h3>
                <p className="small" style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
                    Control how the system interacts with your Plex server.
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <input 
                        type="checkbox" 
                        id="plex_auto_ban" 
                        name="plex_auto_ban" 
                        checked={settings.plex_auto_ban} 
                        onChange={handleChange}
                        style={{ marginRight: '10px' }}
                    />
                    <label htmlFor="plex_auto_ban">
                        <strong>Auto-Ban (Revoke Access)</strong>
                        <div className="small" style={{ color: 'var(--text-muted)' }}>
                            Automatically remove users from Plex shares if they are marked as "Disabled".
                        </div>
                    </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input 
                        type="checkbox" 
                        id="plex_auto_invite" 
                        name="plex_auto_invite" 
                        checked={settings.plex_auto_invite} 
                        onChange={handleChange}
                        style={{ marginRight: '10px' }}
                    />
                    <label htmlFor="plex_auto_invite">
                        <strong>Auto-Invite (Grant Access)</strong>
                        <div className="small" style={{ color: 'var(--text-muted)' }}>
                            Automatically invite users to Plex shares when they are marked as "Active" or pay.
                        </div>
                    </label>
                </div>
            </div>

            {/* SAVE BUTTON */}
            <div style={{ textAlign: 'right' }}>
                <button className="button" onClick={handleSave} style={{ padding: '10px 30px', fontSize: '1rem' }}>
                    Save All Settings
                </button>
            </div>
        </div>
    );
};

export default Settings;