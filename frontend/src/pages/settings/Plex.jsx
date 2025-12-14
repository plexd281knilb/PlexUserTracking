import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "api";

export default function Plex() {
    const [servers, setServers] = useState([]);
    const [newServer, setNewServer] = useState({ name: '', token: '' });
    const [testStatus, setTestStatus] = useState(null);
    
    // Library State
    const [libraryIds, setLibraryIds] = useState([]); // Selected IDs
    const [availableLibraries, setAvailableLibraries] = useState([]); // Fetched from API
    const [libFetchStatus, setLibFetchStatus] = useState('');

    const fetchServers = () => {
        apiGet("/settings/servers").then(r => setServers(r.plex || []));
    };

    const fetchSettings = () => {
        apiGet("/settings").then(s => {
            if(s.default_library_ids) setLibraryIds(s.default_library_ids);
        });
    }

    useEffect(() => { 
        fetchServers(); 
        fetchSettings();
    }, []);

    const testConnection = async () => {
        setTestStatus("Testing...");
        try {
            const res = await apiPost("/settings/test/plex", { token: newServer.token });
            setTestStatus(res.message);
        } catch (e) { setTestStatus("Connection Failed"); }
    };

    const addServer = async () => {
        await apiPost("/settings/servers/plex", newServer, localStorage.getItem('admin_token'));
        setNewServer({ name: '', token: '' });
        setTestStatus(null);
        fetchServers();
    };

    // --- NEW: FETCH LIBRARIES ---
    const handleFetchLibraries = async () => {
        setLibFetchStatus('Connecting to Plex...');
        try {
            // Use the first saved server's token, or the one in the input box
            const tokenToUse = newServer.token || (servers.length > 0 ? servers[0].token : null);
            
            if(!tokenToUse) {
                setLibFetchStatus('Error: No saved server or token found.');
                return;
            }

            const res = await apiPost("/settings/plex/libraries", { token: tokenToUse }, localStorage.getItem('admin_token'));
            setAvailableLibraries(res.libraries);
            setLibFetchStatus(`Success! Found ${res.libraries.length} libraries on ${res.server_name}.`);
        } catch (e) {
            setLibFetchStatus('Failed to fetch. Check container logs.');
            console.error(e);
        }
    };

    const toggleLibrary = (id) => {
        const newIds = libraryIds.includes(id) 
            ? libraryIds.filter(lid => lid !== id)
            : [...libraryIds, id];
        setLibraryIds(newIds);
        
        // Auto-save settings
        apiPost("/settings", { default_library_ids: newIds }, localStorage.getItem('admin_token'));
    };

    return (
        <div className="card">
            <div className="flex" style={{ justifyContent: 'space-between' }}>
                <h3>Plex Servers ({servers.length})</h3>
                <button className="button" style={{ fontSize: '0.8rem' }} onClick={fetchServers}>Refresh</button>
            </div>

            {/* List of Saved Servers */}
            <table className="table" style={{ marginBottom: '30px' }}>
                <thead><tr><th>Name</th><th>Token (Hidden)</th><th>Actions</th></tr></thead>
                <tbody>
                    {servers.map(s => (
                        <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>•••••••••••</td>
                            <td>
                                <button className="button" style={{ backgroundColor: 'var(--danger)', padding: '5px 10px' }}
                                    onClick={() => { apiDelete(`/settings/servers/plex/${s.id}`, localStorage.getItem('admin_token')).then(fetchServers) }}>
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                    {servers.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No Plex servers added.</td></tr>}
                </tbody>
            </table>

            {/* Add New Server Form */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <h4>Add New Connection</h4>
                <div className="flex" style={{ gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="small">Server Name (Alias)</label>
                        <input className="input" placeholder="e.g. Home Server" value={newServer.name} onChange={e => setNewServer({ ...newServer, name: e.target.value })} />
                    </div>
                    <div style={{ flex: 2 }}>
                        <label className="small">X-Plex-Token</label>
                        <input className="input" type="password" placeholder="Token" value={newServer.token} onChange={e => setNewServer({ ...newServer, token: e.target.value })} />
                    </div>
                </div>

                <div className="flex" style={{ marginTop: '15px' }}>
                    <button className="button" onClick={addServer}>Save Server</button>
                    <button className="button" style={{ backgroundColor: '#64748b' }} onClick={testConnection}>Test Connection</button>
                    {testStatus && <span className="small" style={{ color: testStatus.includes('Success') ? '#10b981' : '#ef4444' }}>{testStatus}</span>}
                </div>
            </div>

             {/* DEFAULTS SECTION */}
            <div style={{marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px'}}>
                <h3>Default Access Control</h3>
                <p className="small" style={{marginBottom: '15px'}}>
                    When a user is enabled, they will be granted access to these libraries.
                </p>
                
                <div className="flex" style={{gap: '15px', alignItems: 'flex-start'}}>
                    <div style={{flex: 1}}>
                        <div className="flex" style={{justifyContent: 'space-between', marginBottom: '5px'}}>
                            <label className="small">Allowed Libraries</label>
                            <button className="button" style={{padding: '2px 8px', fontSize: '0.7rem'}} onClick={handleFetchLibraries}>
                                Fetch Libraries
                            </button>
                        </div>
                        
                        <div style={{
                            border: '1px solid var(--border)', 
                            borderRadius: '8px', 
                            padding: '10px', 
                            backgroundColor: 'var(--bg-input)',
                            minHeight: '100px',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {availableLibraries.length === 0 && (
                                <p className="small" style={{textAlign: 'center', marginTop: '30px'}}>
                                    Click "Fetch Libraries" to load.
                                </p>
                            )}
                            
                            {availableLibraries.map(lib => (
                                <div key={lib.id} style={{display: 'flex', alignItems: 'center', marginBottom: '5px'}}>
                                    <input 
                                        type="checkbox" 
                                        checked={libraryIds.includes(lib.id)} 
                                        onChange={() => toggleLibrary(lib.id)}
                                        style={{marginRight: '10px'}}
                                    />
                                    <span className="small">{lib.title} <span style={{color: 'var(--text-muted)', fontSize: '0.7rem'}}>({lib.type})</span></span>
                                </div>
                            ))}
                        </div>
                        {libFetchStatus && <p className="small" style={{marginTop:'5px', color: '#38bdf8'}}>{libFetchStatus}</p>}
                    </div>

                    <div style={{flex: 1}}>
                        <label className="small">Sync Behavior</label>
                        <div className="flex" style={{marginTop:'10px'}}>
                            <input type="checkbox" checked={true} readOnly /> 
                            <span className="small">Auto-Ban on Disable</span>
                        </div>
                        <div className="flex" style={{marginTop:'10px'}}>
                            <input type="checkbox" checked={true} readOnly /> 
                            <span className="small">Auto-Invite on Enable (Uses selected libraries)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}