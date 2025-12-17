import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from 'api';

const Settings = () => {
    const [settings, setSettings] = useState({
        // Fees
        fee_monthly: "0.00",
        fee_yearly: "0.00",
        // Automation
        plex_auto_ban: true,
        plex_auto_invite: true,
        scan_interval_min: 60,
        // Search Terms
        venmo_search_term: 'paid you',
        paypal_search_term: 'sent you',
        zelle_search_term: 'received',
        // Access Control
        default_library_ids: [],
        // SMTP
        smtp_host: "", smtp_port: 465, smtp_user: "", smtp_pass: ""
    });
    
    const [servers, setServers] = useState([]);
    const [libraries, setLibraries] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Plex Server Form
    const [serverForm, setServerForm] = useState({ id: null, name: '', token: '', url: '' });
    const [isEditingServer, setIsEditingServer] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [sets, srvs] = await Promise.all([
                    apiGet('/settings'),
                    apiGet('/settings/servers')
                ]);
                setSettings(prev => ({ ...prev, ...sets }));
                
                // Filter out bad server entries (Ghost Box Fix)
                const plexServers = (srvs.plex || []).filter(s => s.name && s.name.trim() !== "");
                setServers(plexServers);

                const libMap = {};
                await Promise.all(plexServers.map(async (server) => {
                    try {
                        const res = await apiPost('/settings/plex/libraries', { token: server.token, url: server.url }, localStorage.getItem('admin_token'));
                        if (res.libraries) libMap[server.name] = res.libraries;
                    } catch (e) {}
                }));
                setLibraries(libMap);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        loadData();
    }, []);

    const handleSaveSettings = async () => {
        try {
            await apiPost('/settings', settings, localStorage.getItem('admin_token'));
            alert('Settings Saved Successfully');
        } catch (e) { alert('Save failed'); }
    };

    // --- PLEX ACTIONS ---
    const handleSaveServer = async () => {
        try {
            if (isEditingServer) {
                await apiPut(`/settings/servers/plex/${serverForm.id}`, serverForm, localStorage.getItem('admin_token'));
            } else {
                await apiPost("/settings/servers/plex", serverForm, localStorage.getItem('admin_token'));
            }
            window.location.reload();
        } catch (e) { alert("Server save failed"); }
    };

    const handleDeleteServer = async (id) => {
        if(!window.confirm("Remove server?")) return;
        await apiDelete(`/settings/servers/plex/${id}`, localStorage.getItem('admin_token'));
        window.location.reload();
    };

    const handleLibraryCheckbox = (serverName, libId) => {
        const uniqueId = `${serverName}__${libId}`;
        const current = settings.default_library_ids || [];
        let updated = current.includes(uniqueId) ? current.filter(id => id !== uniqueId) : [...current, uniqueId];
        setSettings({ ...settings, default_library_ids: updated });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '50px' }}>
            <h1>System Settings</h1>

            {/* 1. FINANCIALS & SCANNING */}
            <div className="card" style={{marginBottom:'20px'}}>
                <h3>Financials & Scanning</h3>
                <p className="small" style={{color:'var(--text-muted)', marginBottom:'15px'}}>
                    Set standard dues to calculate "Paid Thru" dates.
                </p>
                <div className="flex" style={{gap:'20px', marginBottom:'15px'}}>
                    <div style={{flex:1}}>
                        <label className="small">Monthly Fee ($)</label>
                        <input className="input" value={settings.fee_monthly} onChange={e=>setSettings({...settings, fee_monthly: e.target.value})} placeholder="0.00" />
                    </div>
                    <div style={{flex:1}}>
                        <label className="small">Yearly Fee ($)</label>
                        <input className="input" value={settings.fee_yearly} onChange={e=>setSettings({...settings, fee_yearly: e.target.value})} placeholder="0.00" />
                    </div>
                    <div style={{flex:1}}>
                        <label className="small">Scan Interval (min)</label>
                        <input className="input" type="number" value={settings.scan_interval_min} onChange={e=>setSettings({...settings, scan_interval_min: parseInt(e.target.value)})} />
                    </div>
                </div>

                <label className="small" style={{marginTop:'10px', display:'block'}}>Email Search Terms (Subject Line)</label>
                <div className="flex" style={{gap:'10px', marginTop:'5px'}}>
                    <input className="input" placeholder="Venmo Term" value={settings.venmo_search_term} onChange={e=>setSettings({...settings, venmo_search_term: e.target.value})} />
                    <input className="input" placeholder="PayPal Term" value={settings.paypal_search_term} onChange={e=>setSettings({...settings, paypal_search_term: e.target.value})} />
                    <input className="input" placeholder="Zelle Term" value={settings.zelle_search_term} onChange={e=>setSettings({...settings, zelle_search_term: e.target.value})} />
                </div>
            </div>

            {/* 2. PLEX SERVERS */}
            <div className="card" style={{marginBottom:'20px'}}>
                <h3>Plex Servers</h3>
                <table className="table" style={{marginBottom:'15px'}}>
                    <thead><tr><th>Name</th><th>URL</th><th>Actions</th></tr></thead>
                    <tbody>
                        {servers.map(s => (
                            <tr key={s.id}>
                                <td>{s.name}</td>
                                <td>{s.url || 'Auto'}</td>
                                <td>
                                    <div className="flex" style={{gap:'5px'}}>
                                        <button className="button" style={{padding:'4px', fontSize:'0.7rem'}} onClick={()=>{setServerForm(s); setIsEditingServer(true);}}>Edit</button>
                                        <button className="button" style={{padding:'4px', fontSize:'0.7rem', backgroundColor:'var(--danger)'}} onClick={()=>handleDeleteServer(s.id)}>Del</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div style={{borderTop:'1px solid var(--border)', paddingTop:'10px'}}>
                    <h4>{isEditingServer ? 'Edit Server' : 'Add Server'}</h4>
                    <div className="flex" style={{gap:'10px', flexWrap:'wrap'}}>
                        <input className="input" placeholder="Name" value={serverForm.name} onChange={e=>setServerForm({...serverForm, name: e.target.value})} style={{flex:1}} />
                        <input className="input" type="password" placeholder="X-Plex-Token" value={serverForm.token} onChange={e=>setServerForm({...serverForm, token: e.target.value})} style={{flex:2}} />
                        <input className="input" placeholder="URL (Optional)" value={serverForm.url} onChange={e=>setServerForm({...serverForm, url: e.target.value})} style={{flex:2}} />
                    </div>
                    <div className="flex" style={{gap:'10px', marginTop:'10px'}}>
                        <button className="button" onClick={handleSaveServer}>Save Server</button>
                        {isEditingServer && <button className="button" style={{backgroundColor:'#64748b'}} onClick={()=>{setIsEditingServer(false); setServerForm({id:null, name:'', token:'', url:''});}}>Cancel</button>}
                    </div>
                </div>
            </div>

            {/* 3. ACCESS CONTROL & AUTOMATION */}
            <div className="card" style={{marginBottom:'20px'}}>
                <div className="flex" style={{justifyContent:'space-between', marginBottom:'15px'}}>
                    <h3>Access Control</h3>
                    <div className="flex" style={{gap:'15px'}}>
                        <label style={{display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'}}>
                            <input type="checkbox" checked={settings.plex_auto_ban} onChange={e=>setSettings({...settings, plex_auto_ban: e.target.checked})} />
                            <span className="small">Auto-Ban</span>
                        </label>
                        <label style={{display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'}}>
                            <input type="checkbox" checked={settings.plex_auto_invite} onChange={e=>setSettings({...settings, plex_auto_invite: e.target.checked})} />
                            <span className="small">Auto-Invite</span>
                        </label>
                    </div>
                </div>
                
                <p className="small" style={{color:'var(--text-muted)', marginBottom:'10px'}}>Select libraries to share automatically.</p>
                {servers.map(server => (
                    <div key={server.id} style={{marginBottom: '10px', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px'}}>
                        <strong>{server.name}</strong>
                        {libraries[server.name] ? (
                            <div style={{marginTop:'5px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px'}}>
                                {libraries[server.name].map(lib => (
                                    <label key={`${server.name}__${lib.id}`} style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}>
                                        <input type="checkbox" checked={settings.default_library_ids.includes(`${server.name}__${lib.id}`)} onChange={() => handleLibraryCheckbox(server.name, lib.id)} />
                                        <span style={{fontSize:'0.85rem'}}>{lib.title}</span>
                                    </label>
                                ))}
                            </div>
                        ) : <div className="small" style={{color:'orange'}}>Loading libraries...</div>}
                    </div>
                ))}
            </div>

            {/* 4. NOTIFICATIONS */}
            <div className="card" style={{marginBottom:'20px'}}>
                <h3>Notifications (SMTP)</h3>
                <div className="flex" style={{gap:'10px', marginBottom:'10px'}}>
                    <div style={{flex:2}}><label className="small">Host</label><input className="input" placeholder="smtp.gmail.com" value={settings.smtp_host} onChange={e=>setSettings({...settings, smtp_host: e.target.value})} /></div>
                    <div style={{flex:1}}><label className="small">Port</label><input className="input" value={settings.smtp_port} onChange={e=>setSettings({...settings, smtp_port: e.target.value})} /></div>
                </div>
                <div className="flex" style={{gap:'10px'}}>
                    <div style={{flex:1}}><label className="small">Email</label><input className="input" value={settings.smtp_user} onChange={e=>setSettings({...settings, smtp_user: e.target.value})} /></div>
                    <div style={{flex:1}}><label className="small">Password</label><input className="input" type="password" value={settings.smtp_pass} onChange={e=>setSettings({...settings, smtp_pass: e.target.value})} /></div>
                </div>
            </div>

            <button className="button" onClick={handleSaveSettings} style={{width:'100%', padding:'15px', fontSize:'1.1rem'}}>Save All Settings</button>
        </div>
    );
};

export default Settings;