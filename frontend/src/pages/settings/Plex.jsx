import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "api";

export default function Plex() {
    const [servers, setServers] = useState([]);
    const [newServer, setNewServer] = useState({ name: '', token: '', url: '' });
    const [testStatus, setTestStatus] = useState(null);
    
    // Library State
    const [libraryIds, setLibraryIds] = useState([]);
    const [availableLibraries, setAvailableLibraries] = useState([]);
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
        setNewServer({ name: '', token: '', url: '' });
        setTestStatus(null);
        fetchServers();
    };

    // --- UPDATED: FETCH FROM ALL SERVERS ---
    const handleFetchLibraries = async () => {
        setLibFetchStatus('Starting scan...');
        let allLibs = [];
        let errors = [];

        // 1. Fetch from Saved Servers
        for (const server of servers) {
            try {
                setLibFetchStatus(`Scanning ${server.name}...`);
                const res = await apiPost("/settings/plex/libraries", { 
                    token: server.token,
                    url: server.url 
                }, localStorage.getItem('admin_token'));
                
                // Tag libraries with Server Name
                const taggedLibs = res.libraries.map(lib => ({
                    ...lib,
                    server_name: server.name,
                    unique_key: `${server.name}-${lib.id}` // Unique key for React list
                }));
                allLibs = [...allLibs, ...taggedLibs];
            } catch (e) {
                console.error(e);
                errors.push(`${server.name}: Failed`);
            }
        }

        // 2. Fetch from New Input (if typed)
        if (newServer.token) {
            try {
                setLibFetchStatus(`Scanning New Server...`);
                const res = await apiPost("/settings/plex/libraries", { 
                    token: newServer.token,
                    url: newServer.url
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
        
        if (allLibs.length > 0) {
            setLibFetchStatus(`Success! Found ${allLibs.length} libraries across ${servers.length} servers.`);
        } else {
            setLibFetchStatus(`Failed. ${errors.join(', ')}`);
        }
    };

    const toggleLibrary = (id) => {
        const newIds = libraryIds.includes(id) ? libraryIds.filter(lid => lid !== id) : [...libraryIds, id];
        setLibraryIds(newIds);
        apiPost("/settings", { default_library_ids: newIds }, localStorage.getItem('admin_token'));
    };

    return (
        <div className="card">
            <div className="flex" style={{ justifyContent: 'space-between' }}>
                <h3>Plex Servers ({servers.length})</h3>
                <button className="button" style={{ fontSize: '0.8rem' }} onClick={fetchServers}>Refresh</button>
            </div>

            <table className="table" style={{ marginBottom: '30px' }}>
                <thead><tr><th>Name</th><th>URL</th><th>Actions</th></tr></thead>
                <tbody>
                    {servers.map(s => (
                        <tr key={s.id}>
                            <td>{s.name}</td>
                            <td className="small">{s.url || 'Auto-Discover'}</td>
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

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <h4>Add New Connection</h4>
                <div className="flex" style={{ gap: '10px', alignItems: 'flex-end', flexWrap:'wrap' }}>
                    <div style={{ flex: 1, minWidth:'150px' }}>
                        <label className="small">Server Name</label>
                        <input className="input" placeholder="e.g. Home Server" value={newServer.name} onChange={e => setNewServer({ ...newServer, name: e.target.value })} />
                    </div>
                    <div style={{ flex: 2, minWidth:'200px' }}>
                        <label className="small">X-Plex-Token</label>
                        <input className="input" type="password" placeholder="Token" value={newServer.token} onChange={e => setNewServer({ ...newServer, token: e.target.value })} />
                    </div>
                    <div style={{ flex: 2, minWidth:'200px' }}>
                        <label className="small">Manual URL (Optional)</label>
                        <input className="input" placeholder="http://192.168.1.5:32400" value={newServer.url} onChange={e => setNewServer({ ...newServer, url: e.target.value })} />
                    </div>
                </div>

                <div className="flex" style={{ marginTop: '15px' }}>
                    <button className="button" onClick={addServer}>Save Server</button>
                    <button className="button" style={{ backgroundColor: '#64748b' }} onClick={testConnection}>Test Token</button>
                    {testStatus && <span className="small" style={{ color: testStatus.includes('Success') ? '#10b981' : '#ef4444' }}>{testStatus}</span>}
                </div>
            </div>

            <div style={{marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px'}}>
                <h3>Default Access Control</h3>
                <div className="flex" style={{gap: '15px', alignItems: 'flex-start'}}>
                    <div style={{flex: 1}}>
                        <div className="flex" style={{justifyContent: 'space-between', marginBottom: '5px'}}>
                            <label className="small">Allowed Libraries</label>
                            <button className="button" style={{padding: '2px 8px', fontSize: '0.7rem'}} onClick={handleFetchLibraries}>Fetch Libraries</button>
                        </div>
                        <div style={{border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', backgroundColor: 'var(--bg-input)', minHeight: '100px', maxHeight: '300px', overflowY: 'auto'}}>
                            
                            {/* Group Libraries by Server */}
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
                    <div style={{flex: 1}}>
                        <label className="small">Sync Behavior</label>
                        <div className="flex" style={{marginTop:'10px'}}><input type="checkbox" checked={true} readOnly /> <span className="small">Auto-Ban on Disable</span></div>
                        <div className="flex" style={{marginTop:'10px'}}><input type="checkbox" checked={true} readOnly /> <span className="small">Auto-Invite on Enable</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}