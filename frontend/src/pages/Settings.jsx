import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from 'api';

const Settings = () => {
    const [settings, setSettings] = useState({
        // Financials
        fee_monthly: "0.00", fee_yearly: "0.00", scan_interval_min: 60,
        // Automation Timing
        notify_days_monthly: 3, notify_days_yearly: 7,
        // Search Terms
        venmo_search_term: 'paid you', paypal_search_term: 'sent you', zelle_search_term: 'received',
        // SMTP
        smtp_host: "", smtp_port: 465, smtp_user: "", smtp_pass: ""
    });
    
    const [servers, setServers] = useState([]);
    const [scanners, setScanners] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [serverForm, setServerForm] = useState({ id: null, name: '', token: '', url: '' });
    const [scannerForm, setScannerForm] = useState({ id: null, type: 'Venmo', email: '', password: '', imap_server: 'imap.gmail.com', port: 993, enabled: true });
    
    const [isEditingServer, setIsEditingServer] = useState(false);
    const [isEditingScanner, setIsEditingScanner] = useState(false);
    
    const [testResults, setTestResults] = useState({});

    useEffect(() => {
        const loadData = async () => {
            try {
                const [sets, srvs, scans] = await Promise.all([
                    apiGet('/settings'),
                    apiGet('/settings/servers'),
                    apiGet('/settings/payment_accounts')
                ]);
                setSettings(prev => ({ ...prev, ...sets }));
                
                const plexServers = (srvs.plex || []).filter(s => s.name && s.name.trim() !== "");
                setServers(plexServers);
                setScanners(scans || []);
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

    // --- PLEX SERVERS ---
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

    const handleTestServer = async (server) => {
        setTestResults(prev => ({ ...prev, [server.id]: 'Testing...' }));
        try {
            const res = await apiPost("/settings/test/plex", { token: server.token, url: server.url });
            setTestResults(prev => ({ ...prev, [server.id]: res.status === 'success' ? '✅ OK' : '❌ Fail' }));
        } catch (e) { setTestResults(prev => ({ ...prev, [server.id]: '❌ Error' })); }
    };

    // --- PAYMENT SCANNERS ---
    const handleSaveScanner = async () => {
        try {
            if (isEditingScanner) {
                await apiPut(`/settings/payment_accounts/${scannerForm.id}`, scannerForm, localStorage.getItem('admin_token'));
            } else {
                await apiPost("/settings/payment_accounts", scannerForm, localStorage.getItem('admin_token'));
            }
            window.location.reload();
        } catch (e) { alert("Scanner save failed"); }
    };

    const handleDeleteScanner = async (id) => {
        if(!window.confirm("Remove scanner account?")) return;
        await apiDelete(`/settings/payment_accounts/${id}`, localStorage.getItem('admin_token'));
        window.location.reload();
    };

    const handleTestScanner = async (scanner) => {
        setTestResults(prev => ({ ...prev, [`scan_${scanner.id}`]: 'Testing...' }));
        try {
            const res = await apiPost("/settings/test/email", scanner);
            setTestResults(prev => ({ ...prev, [`scan_${scanner.id}`]: res.status === 'success' ? '✅ OK' : '❌ Fail' }));
        } catch (e) { setTestResults(prev => ({ ...prev, [`scan_${scanner.id}`]: '❌ Error' })); }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '50px' }}>
            <h1>System Settings</h1>

            {/* 1. FINANCIALS */}
            <div className="card" style={{marginBottom:'20px'}}>
                <h3>Financials & Automation Schedule</h3>
                <div className="flex" style={{gap:'20px', marginBottom:'15px'}}>
                    <div style={{flex:1}}><label className="small">Monthly Fee ($)</label><input className="input" value={settings.fee_monthly} onChange={e=>setSettings({...settings, fee_monthly: e.target.value})} placeholder="0.00" /></div>
                    <div style={{flex:1}}><label className="small">Yearly Fee ($)</label><input className="input" value={settings.fee_yearly} onChange={e=>setSettings({...settings, fee_yearly: e.target.value})} placeholder="0.00" /></div>
                </div>
                <hr style={{borderColor:'var(--border)', margin:'15px 0'}}/>
                <div className="flex" style={{gap:'20px'}}>
                    <div style={{flex:1}}><label className="small">Monthly Reminder (Days Before)</label><input className="input" type="number" value={settings.notify_days_monthly} onChange={e=>setSettings({...settings, notify_days_monthly: parseInt(e.target.value)})} /></div>
                    <div style={{flex:1}}><label className="small">Yearly Reminder (Days Before)</label><input className="input" type="number" value={settings.notify_days_yearly} onChange={e=>setSettings({...settings, notify_days_yearly: parseInt(e.target.value)})} /></div>
                    <div style={{flex:1}}><label className="small">Scan Interval (min)</label><input className="input" type="number" value={settings.scan_interval_min} onChange={e=>setSettings({...settings, scan_interval_min: parseInt(e.target.value)})} /></div>
                </div>
            </div>

            {/* 2. PAYMENT SCANNERS */}
            <div className="card" style={{marginBottom:'20px'}}>
                <h3>Payment Scanners (IMAP)</h3>
                <p className="small" style={{color:'var(--text-muted)'}}>Connect email accounts to scan for Venmo, Zelle, and PayPal receipts.</p>
                <table className="table" style={{marginBottom:'15px'}}>
                    <thead><tr><th>Type</th><th>Email</th><th>Server</th><th>Actions</th></tr></thead>
                    <tbody>
                        {scanners.map(s => (
                            <tr key={s.id}>
                                <td><span style={{fontWeight:'bold'}}>{s.type}</span></td>
                                <td>{s.email}</td>
                                <td>{s.imap_server}</td>
                                <td>
                                    <div className="flex" style={{gap:'5px', alignItems:'center'}}>
                                        <button className="button" style={{padding:'4px', fontSize:'0.7rem', backgroundColor:'#64748b'}} onClick={()=>handleTestScanner(s)}>Test</button>
                                        <button className="button" style={{padding:'4px', fontSize:'0.7rem'}} onClick={()=>{setScannerForm(s); setIsEditingScanner(true);}}>Edit</button>
                                        <button className="button" style={{padding:'4px', fontSize:'0.7rem', backgroundColor:'var(--danger)'}} onClick={()=>handleDeleteScanner(s.id)}>Del</button>
                                        {testResults[`scan_${s.id}`] && <span className="small">{testResults[`scan_${s.id}`]}</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div style={{borderTop:'1px solid var(--border)', paddingTop:'10px'}}>
                    <h4>{isEditingScanner ? 'Edit Scanner' : 'Add Scanner'}</h4>
                    <div className="flex" style={{gap:'10px', flexWrap:'wrap', marginBottom:'10px'}}>
                        <select className="input" value={scannerForm.type} onChange={e=>setScannerForm({...scannerForm, type: e.target.value})} style={{flex:1}}>
                            <option value="Venmo">Venmo</option>
                            <option value="Zelle">Zelle</option>
                            <option value="PayPal">PayPal</option>
                        </select>
                        <input className="input" placeholder="Email" value={scannerForm.email} onChange={e=>setScannerForm({...scannerForm, email: e.target.value})} style={{flex:2}} />
                        <input className="input" type="password" placeholder="App Password" value={scannerForm.password} onChange={e=>setScannerForm({...scannerForm, password: e.target.value})} style={{flex:2}} />
                    </div>
                    <div className="flex" style={{gap:'10px', flexWrap:'wrap'}}>
                        <input className="input" placeholder="IMAP Server (e.g., imap.gmail.com)" value={scannerForm.imap_server} onChange={e=>setScannerForm({...scannerForm, imap_server: e.target.value})} style={{flex:2}} />
                        <input className="input" placeholder="Port" type="number" value={scannerForm.port} onChange={e=>setScannerForm({...scannerForm, port: parseInt(e.target.value)})} style={{flex:1}} />
                        <label style={{display:'flex', alignItems:'center', gap:'5px', flex:1, cursor:'pointer'}}>
                            <input type="checkbox" checked={scannerForm.enabled} onChange={e=>setScannerForm({...scannerForm, enabled: e.target.checked})} /> Enable
                        </label>
                    </div>
                    <div className="flex" style={{gap:'10px', marginTop:'10px'}}>
                        <button className="button" onClick={handleSaveScanner}>Save Scanner</button>
                        {isEditingScanner && <button className="button" style={{backgroundColor:'#64748b'}} onClick={()=>{setIsEditingScanner(false); setScannerForm({id:null, type:'Venmo', email:'', password:'', imap_server:'imap.gmail.com', port:993, enabled:true});}}>Cancel</button>}
                    </div>
                </div>
            </div>

            {/* 3. PLEX SERVERS */}
            <div className="card" style={{marginBottom:'20px'}}>
                <h3>Plex Servers (For Import Only)</h3>
                <table className="table" style={{marginBottom:'15px'}}>
                    <thead><tr><th>Name</th><th>URL</th><th>Actions</th></tr></thead>
                    <tbody>
                        {servers.map(s => (
                            <tr key={s.id}>
                                <td>{s.name}</td>
                                <td>{s.url || 'Auto'}</td>
                                <td>
                                    <div className="flex" style={{gap:'5px', alignItems:'center'}}>
                                        <button className="button" style={{padding:'4px', fontSize:'0.7rem', backgroundColor:'#64748b'}} onClick={()=>handleTestServer(s)}>Test</button>
                                        <button className="button" style={{padding:'4px', fontSize:'0.7rem'}} onClick={()=>{setServerForm(s); setIsEditingServer(true);}}>Edit</button>
                                        <button className="button" style={{padding:'4px', fontSize:'0.7rem', backgroundColor:'var(--danger)'}} onClick={()=>handleDeleteServer(s.id)}>Del</button>
                                        {testResults[s.id] && <span className="small">{testResults[s.id]}</span>}
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

            {/* 4. NOTIFICATIONS */}
            <div className="card" style={{marginBottom:'20px'}}>
                <h3>Notifications (SMTP)</h3>
                <p className="small" style={{color:'var(--text-muted)'}}>Required for automated email reminders.</p>
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