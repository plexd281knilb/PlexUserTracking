import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "api";

export default function Plex() {
    const [servers, setServers] = useState([]);
    
    // Form State
    const [formState, setFormState] = useState({ id: null, name: '', token: '', url: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [testStatus, setTestStatus] = useState(null);
    const [rowTestResults, setRowTestResults] = useState({});

    // Settings State
    const [libraryIds, setLibraryIds] = useState([]);
    const [syncSettings, setSyncSettings] = useState({
        plex_auto_ban: true,   // Default to true
        plex_auto_invite: true // Default to true
    });
    
    const [availableLibraries, setAvailableLibraries] = useState([]);
    const [libFetchStatus, setLibFetchStatus] = useState('');

    const fetchServers = () => {
        apiGet("/settings/servers").then(r => setServers(r.plex || []));
    };

    const fetchSettings = () => {
        apiGet("/settings").then(s => {
            if(s.default_library_ids) setLibraryIds(s.default_library_ids);
            
            // Load Sync Settings (Default to true if missing)
            setSyncSettings({
                plex_auto_ban: s.plex_auto_ban !== undefined ? s.plex_auto_ban : true,
                plex_auto_invite: s.plex_auto_invite !== undefined ? s.plex_auto_invite : true
            });
        });
    }

    useEffect(() => { 
        fetchServers(); 
        fetchSettings();
    }, []);

    // --- ACTIONS ---

    const handleTestRow = async (server) => {
        setRowTestResults(prev => ({ ...prev, [server.id]: 'Testing...' }));
        try {
            const res = await apiPost("/settings/test/plex", { token: server.token });
            setRowTestResults(prev => ({ ...prev, [server.id]: res.status === 'success' ? '✅ OK' : '❌ Fail' }));
        } catch (e) {
            setRowTestResults(prev => ({ ...prev, [server.id]: '❌ Error' }));
        }
    };

    const handleEditRow = (server) => {
        setFormState(server);
        setIsEditing(true);
        setTestStatus(null);
        document.getElementById('server-form').scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setFormState({ id: null, name: '', token: '', url: '' });
        setIsEditing(false);
        setTestStatus(null);
    };

    const handleSaveServer = async () => {
        if (isEditing) {
            await apiPut(`/settings/servers/plex/${formState.id}`, formState, localStorage.getItem('admin_token'));
        } else {
            await apiPost("/settings/servers/plex", formState, localStorage.getItem('admin_token'));
        }
        handleCancelEdit();
        fetchServers();
    };

    const handleRemove = (id) => {
        if(!window.confirm("Remove this server?")) return;
        apiDelete(`/settings/servers/plex/${id}`, localStorage.getItem('admin_token')).then(fetchServers);
    };

    const testFormToken = async () => {
        setTestStatus("Testing...");
        try {
            const res = await apiPost("/settings/test/plex", { token: formState.token });
            setTestStatus(res.message);
        } catch (e) { setTestStatus("Connection Failed"); }
    };

    // --- LIBRARIES & SYNC ---

    const handleFetchLibraries = async () => {
        setLibFetchStatus('Starting scan...');
        let allLibs = [];
        let errors = [];

        // 1. Saved Servers
        for (const server of servers) {
            try {
                setLibFetchStatus(`Scanning ${server.name}...`);
                const res = await apiPost("/settings/plex/libraries", { 
                    token: server.token, 
                    url: server.url 
                }, localStorage.getItem('admin_token'));
                
                const taggedLibs = res.libraries.map(lib => ({
                    ...lib,
                    server_name: server.name,
                    unique_key: `${server.name}-${lib.id}`
                }));
                allLibs = [...allLibs, ...taggedLibs];
            } catch (e) {
                errors.push(`${server.name}: Failed`);
            }
        }

        // 2. Form Input
        if (formState.token) {
            try {
                setLibFetchStatus(`Scanning New Server...`);
                const res = await apiPost("/settings/plex/libraries", { 
                    token: formState.token,
                    url: formState.url
                }, localStorage.getItem('admin_token'));
                
                const taggedLibs = res.libraries.map(lib => ({
                    ...lib,
                    server_name: "New Server",
                    unique_key: `New-${lib.id}`
                }));
                allLibs = [...allLibs, ...taggedLibs];
            } catch (e) {}
        }

        setAvailableLibraries(allLibs);
        if (allLibs.length > 0) setLibFetchStatus(`Success! Found ${allLibs.length} libraries.`);
        else setLibFetchStatus(`Failed. ${errors.join(', ')}`);
    };

    const toggleLibrary = (id) => {
        const newIds = libraryIds.includes(id) ? libraryIds.filter(lid => lid !== id) : [...libraryIds, id];
        setLibraryIds(newIds);
        apiPost("/settings", { default_library_ids: newIds }, localStorage.getItem('admin_token'));
    };

    const toggleSyncSetting = (key) => {
        const newValue = !syncSettings[key];
        const newSettings = { ...syncSettings, [key]: newValue };
        setSyncSettings(newSettings);
        // Auto-save
        apiPost("/settings", newSettings, localStorage.getItem('admin_token'));
    };

    return (
        <div className="card">
            <div className="flex" style={{ justifyContent: 'space-between' }}>
                <h3>Plex Servers ({servers.length})</h3>
                <button className="button" style={{ fontSize: '0.8rem' }} onClick={fetchServers}>Refresh</button>
            </div>

            <table className="table" style={{ marginBottom: '30px' }}>
                <thead><tr><th>Name</th><th>URL</th><th style={{width: '250px'}}>Actions</th></tr></thead>
                <tbody>
                    {servers.map(s => (
                        <tr key={s.id} style={{backgroundColor: isEditing && formState.id === s.id ? 'rgba(56, 189, 248, 0.1)' : 'transparent'}}>
                            <td style={{fontWeight: isEditing && formState.id === s.id ? 'bold' : 'normal'}}>{s.name}</td>
                            <td className="small" style={{color:'var(--text-muted)'}}>{s.url || 'Auto'}</td>
                            <td>
                                <div className="flex" style={{ gap: '5px', alignItems: 'center' }}>
                                    <button className="button" style={{ padding: '4px 8px', fontSize: '0.7rem', backgroundColor: '#64748b' }}
                                        onClick={() => handleTestRow(s)}>Test</button>
                                    <button className="button" style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                        onClick={() => handleEditRow(s)}>Edit</button>
                                    <button className="button" style={{ padding: '4px 8px', fontSize: '0.7rem', backgroundColor: 'var(--danger)' }}
                                        onClick={() => handleRemove(s.id)}>Remove</button>
                                    {rowTestResults[s.id] && <span className="small" style={{ marginLeft: '5px' }}>{rowTestResults[s.id]}</span>}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {servers.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No Plex servers added.</td></tr>}
                </tbody>
            </table>

            {/* FORM SECTION */}
            <div id="server-form" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <h4 style={{color: isEditing ? '#38bdf8' : 'white'}}>
                    {isEditing ? `Edit Server: ${formState.name}` : 'Add New Connection'}
                </h4>
                
                <div className="flex" style={{ gap: '10px', alignItems: 'flex-end', flexWrap:'wrap' }}>
                    <div style={{ flex: 1, minWidth:'150px' }}>
                        <label className="small">Server Name</label>
                        <input className="input" placeholder="e.g. Home Server" 
                            value={formState.name} 
                            onChange={e => setFormState({ ...formState, name: e.target.value })} 
                        />
                    </div>
                    <div style={{ flex: 2, minWidth:'200px' }}>
                        <label className="small">X-Plex-Token</label>
                        <input className="input" type="password" placeholder="Token" 
                            value={formState.token} 
                            onChange={e => setFormState({ ...formState, token: e.target.value })} 
                        />
                    </div>
                    <div style={{ flex: 2, minWidth:'200px' }}>
                        <label className="small">Manual URL (Optional)</label>
                        <input className="input" placeholder="http://192.168.1.5:32400" 
                            value={formState.url} 
                            onChange={e => setFormState({ ...formState, url: e.target.value })} 
                        />
                    </div>
                </div>

                <div className="flex" style={{ marginTop: '15px', gap: '10px' }}>
                    <button className="button" style={{backgroundColor: isEditing ? '#eab308' : 'var(--accent)', color: isEditing ? 'black' : 'white'}} 
                        onClick={handleSaveServer}>
                        {isEditing ? 'Update Server' : 'Save Server'}
                    </button>
                    {isEditing && <button className="button" style={{ backgroundColor: '#64748b' }} onClick={handleCancelEdit}>Cancel</button>}
                    <button className="button" style={{ backgroundColor: '#475569' }} onClick={testFormToken}>Test Form Data</button>
                    {testStatus && <span className="small" style={{ alignSelf:'center', color: testStatus.includes('Success') ? '#10b981' : '#ef4444' }}>{testStatus}</span>}
                </div>
            </div>

            {/* SYNC SECTION */}
            <div style={{marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px'}}>
                <h3>Default Access Control</h3>
                <div className="flex" style={{gap: '15px', alignItems: 'flex-start'}}>
                    <div style={{flex: 1}}>
                        <div className="flex" style={{justifyContent: 'space-between', marginBottom: '5px'}}>
                            <label className="small">Allowed Libraries</label>
                            <button className="button" style={{padding: '2px 8px', fontSize: '0.7rem'}} onClick={handleFetchLibraries}>Fetch Libraries</button>
                        </div>
                        <div style={{border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', backgroundColor: 'var(--bg-input)', minHeight: '100px', maxHeight: '300px', overflowY: 'auto'}}>
                            {availableLibraries.map(lib => (
                                <div key={lib.unique_key} style={{display: 'flex', alignItems: 'center', marginBottom: '5px', paddingLeft: '5px'}}>
                                    <input type="checkbox" checked={libraryIds.includes(lib.id)} onChange={() => toggleLibrary(lib.id)} style={{marginRight: '10px'}} />
                                    <span className="small">
                                        <span style={{fontWeight:'bold', color:'var(--accent)', marginRight:'5px'}}>[{lib.server_name}]</span>
                                        {lib.title} 
                                        <span style={{color: 'var(--text-muted)', fontSize:'0.7rem', marginLeft:'5px'}}>({lib.type})</span>
                                    </span>
                                </div>
                            ))}
                            {availableLibraries.length === 0 && <p className="small" style={{textAlign:'center', marginTop:'30px'}}>Click Fetch to load.</p>}
                        </div>
                        {libFetchStatus && <p className="small" style={{marginTop:'5px', color: '#38bdf8'}}>{libFetchStatus}</p>}
                    </div>
                    
                    {/* EDITABLE SETTINGS */}
                    <div style={{flex: 1}}>
                        <label className="small">Sync Behavior</label>
                        
                        <div className="flex" style={{marginTop:'10px', cursor:'pointer'}} onClick={() => toggleSyncSetting('plex_auto_ban')}>
                            <input type="checkbox" checked={syncSettings.plex_auto_ban} readOnly style={{cursor:'pointer'}} /> 
                            <span className="small">Auto-Ban on Disable (Remove Access)</span>
                        </div>
                        
                        <div className="flex" style={{marginTop:'10px', cursor:'pointer'}} onClick={() => toggleSyncSetting('plex_auto_invite')}>
                            <input type="checkbox" checked={syncSettings.plex_auto_invite} readOnly style={{cursor:'pointer'}} /> 
                            <span className="small">Auto-Invite on Enable (Grant Selected Libraries)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}