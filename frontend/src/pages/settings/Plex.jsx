import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "api";

export default function Plex() {
    const [servers, setServers] = useState([]);
    const [newServer, setNewServer] = useState({ name: '', token: '' });
    const [testStatus, setTestStatus] = useState(null);

    const fetchServers = () => {
        apiGet("/settings/servers").then(r => setServers(r.plex || []));
    };

    useEffect(() => { fetchServers(); }, []);

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

             {/* NEW DEFAULTS SECTION */}
            <div style={{marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px'}}>
                <h3>Default Access Control</h3>
                <p className="small" style={{marginBottom: '15px'}}>
                    When a user is enabled, they will be granted access to these libraries.
                </p>
                
                <div className="flex" style={{gap: '15px'}}>
                    <div style={{flex: 1}}>
                        <label className="small">Allowed Libraries (IDs or 'All')</label>
                        <input className="input" placeholder="e.g. All" disabled value="All (Coming in v2)" />
                    </div>
                    <div style={{flex: 1}}>
                        <label className="small">Sync Behavior</label>
                        <div className="flex" style={{marginTop:'10px'}}>
                            <input type="checkbox" checked={true} readOnly /> 
                            <span className="small">Auto-Ban on Disable</span>
                        </div>
                    </div>
                </div>
                <p className="small" style={{color: 'var(--text-muted)', marginTop:'10px'}}>
                    * Currently, "Disable" removes the user from the share list. "Enable" requires you to re-share manually until the Library ID fetcher is finished.
                </p>
            </div>
        </div>
    );
}