import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from 'api';

const Settings = () => {
    const [settings, setSettings] = useState({
        fee_monthly: "0.00",
        fee_yearly: "0.00",
        plex_auto_ban: true,
        plex_auto_invite: true,
        default_library_ids: [], // Format: "ServerName__LibraryID"
        venmo_search_term: '',
        paypal_search_term: '',
        zelle_search_term: ''
    });
    const [servers, setServers] = useState([]);
    const [libraries, setLibraries] = useState({}); // { "ServerName": [ {id, title, type}, ... ] }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Load Settings and Servers
                const [sets, srvs] = await Promise.all([
                    apiGet('/settings'),
                    apiGet('/settings/servers')
                ]);
                
                // Merge loaded settings with defaults to ensure fields exist
                setSettings(prev => ({ ...prev, ...sets }));
                
                const plexServers = srvs.plex || [];
                setServers(plexServers);

                // 2. Automatically Fetch Libraries for ALL connected servers
                const libMap = {};
                await Promise.all(plexServers.map(async (server) => {
                    try {
                        const res = await apiPost('/settings/plex/libraries', { token: server.token, url: server.url }, localStorage.getItem('admin_token'));
                        if (res.libraries) {
                            libMap[server.name] = res.libraries;
                        }
                    } catch (e) { console.error(`Failed to load libs for ${server.name}`); }
                }));
                setLibraries(libMap);

            } catch (e) { console.error(e); }
            setLoading(false);
        };
        loadData();
    }, []);

    // Handle generic text/number inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    // Handle checkboxes for booleans
    const handleToggleChange = (e) => {
        const { name, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: checked }));
    };

    // Handle Library Selection (Unique ID logic)
    const handleLibraryCheckbox = (serverName, libId) => {
        // Unique Key: ServerName__LibraryID to prevent linking unrelated servers
        const uniqueId = `${serverName}__${libId}`;
        const current = settings.default_library_ids || [];
        
        let updated;
        if (current.includes(uniqueId)) {
            updated = current.filter(id => id !== uniqueId);
        } else {
            updated = [...current, uniqueId];
        }
        
        setSettings({ ...settings, default_library_ids: updated });
    };

    const handleSave = async () => {
        try {
            await apiPost('/settings', settings, localStorage.getItem('admin_token'));
            alert('Settings Saved Successfully');
        } catch (e) { alert('Save failed'); }
    };

    if (loading) return <div>Loading Settings...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1>System Settings</h1>

            {/* SECTION 1: SUBSCRIPTION COSTS */}
            <div className="card" style={{marginBottom:'20px'}}>
                <h3>Subscription Costs</h3>
                <p className="small" style={{color:'var(--text-muted)', marginBottom:'10px'}}>
                    Set the standard amount users are expected to pay. This helps calculate "Paid Thru" dates.
                </p>
                <div className="flex" style={{gap:'20px'}}>
                    <div style={{flex:1}}>
                        <label className="small">Monthly Fee ($)</label>
                        <input 
                            className="input" 
                            name="fee_monthly"
                            value={settings.fee_monthly} 
                            onChange={handleInputChange} 
                            placeholder="0.00" 
                        />
                    </div>
                    <div style={{flex:1}}>
                        <label className="small">Yearly Fee ($)</label>
                        <input 
                            className="input" 
                            name="fee_yearly"
                            value={settings.fee_yearly} 
                            onChange={handleInputChange} 
                            placeholder="0.00" 
                        />
                    </div>
                </div>
            </div>

            {/* SECTION 2: PLEX AUTOMATION */}
            <div className="card" style={{marginBottom:'20px'}}>
                <h3>Plex Automation</h3>
                <div style={{display:'flex', alignItems:'center', marginBottom:'10px'}}>
                    <input 
                        type="checkbox" 
                        id="plex_auto_ban" 
                        name="plex_auto_ban"
                        checked={settings.plex_auto_ban} 
                        onChange={handleToggleChange} 
                        style={{marginRight:'10px'}} 
                    />
                    <label htmlFor="plex_auto_ban">
                        <strong>Auto-Ban (Revoke Access)</strong>
                        <div className="small" style={{color:'var(--text-muted)'}}>Remove users from Plex shares when marked as "Disabled".</div>
                    </label>
                </div>
                <div style={{display:'flex', alignItems:'center'}}>
                    <input 
                        type="checkbox" 
                        id="plex_auto_invite" 
                        name="plex_auto_invite"
                        checked={settings.plex_auto_invite} 
                        onChange={handleToggleChange} 
                        style={{marginRight:'10px'}} 
                    />
                    <label htmlFor="plex_auto_invite">
                        <strong>Auto-Invite (Grant Access)</strong>
                        <div className="small" style={{color:'var(--text-muted)'}}>Invite users to Plex shares when marked as "Active".</div>
                    </label>
                </div>
            </div>

            {/* SECTION 3: ACCESS CONTROL (LIBRARIES) */}
            <div className="card" style={{marginBottom:'20px'}}>
                <h3>Default Access Control</h3>
                <p className="small" style={{color:'var(--text-muted)'}}>
                    Select which libraries to share automatically when a user is invited.
                </p>
                
                {servers.length === 0 && <p className="small">No Plex servers connected.</p>}

                {servers.map(server => (
                    <div key={server.id} style={{marginBottom: '15px', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px'}}>
                        <strong>{server.name}</strong>
                        
                        {libraries[server.name] ? (
                            <div style={{marginTop:'10px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px'}}>
                                {libraries[server.name].map(lib => {
                                    const uniqueId = `${server.name}__${lib.id}`;
                                    return (
                                        <label key={uniqueId} style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}>
                                            <input 
                                                type="checkbox" 
                                                checked={settings.default_library_ids.includes(uniqueId)} 
                                                onChange={() => handleLibraryCheckbox(server.name, lib.id)}
                                            />
                                            <span style={{fontSize:'0.9rem'}}>{lib.title} <span style={{fontSize:'0.7rem', color:'gray'}}>({lib.type})</span></span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="small" style={{marginTop:'10px', color:'orange'}}>Loading libraries...</div>
                        )}
                    </div>
                ))}
            </div>

            <button className="button" onClick={handleSave} style={{width:'100%', padding:'12px', fontSize:'1rem'}}>
                Save All Settings
            </button>
        </div>
    );
};

export default Settings;