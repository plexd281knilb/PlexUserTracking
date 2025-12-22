import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from 'api';

const Settings = () => {
    const [settings, setSettings] = useState({
        fee_monthly: "0.00", fee_yearly: "0.00", scan_interval_min: 60,
        notify_days_monthly: 3, notify_days_yearly: 7,
        venmo_search_term: 'paid you', paypal_search_term: 'sent you', zelle_search_term: 'received',
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
                setServers((srvs.plex || []).filter(s => s.name));
                setScanners(Array.isArray(scans) ? scans : []);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        loadData();
    }, []);

    const handleSaveSettings = async () => {
        try {
            await apiPost('/settings', settings, localStorage.getItem('admin_token'));
            alert('General Settings Saved Successfully');
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

    // --- SMTP TEST ---
    const handleTestSMTP = async () => {
        setTestResults(prev => ({ ...prev, smtp: 'Sending...' }));
        try {
            const res = await apiPost("/settings/test/smtp", {
                smtp_host: settings.smtp_host,
                smtp_port: settings.smtp_port,
                smtp_user: settings.smtp_user,
                smtp_pass: settings.smtp_pass
            });
            if (res.status === 'success') {
                alert("Email sent successfully! Check your inbox.");
                setTestResults(prev => ({ ...prev, smtp: '✅ Sent' }));
            } else {
                alert("Failed: " + res.message);
                setTestResults(prev => ({ ...prev, smtp: '❌ Fail' }));
            }
        } catch (e) { 
            alert("Error sending test email");
            setTestResults(prev => ({ ...prev, smtp: '❌ Error' })); 
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container">
            <h1>System Settings</h1>

            {/* 1. FINANCIALS */}
            <div className="card">
                <h3>Financials & Automation Schedule</h3>
                <div className="grid-responsive" style={{marginBottom:'15px'}}>
                    <div style={{flex:1}}><label>Monthly Fee ($)</label><input className="input" value={settings.fee_monthly} onChange={e=>setSettings({...settings, fee_monthly: e.target.value})} placeholder="0.00" /></div>
                    <div style={{flex:1}}><label>Yearly Fee ($)</label><input className="input" value={settings.fee_yearly} onChange={e=>setSettings({...settings, fee_yearly: e.target.value})} placeholder="0.00" /></div>
                </div>
                <div className="grid-responsive">
                    <div style={{flex:1}}><label>Monthly Reminder (Days)</label><input className="input" type="number" value={settings.notify_days_monthly} onChange={e=>setSettings({...settings, notify_days_monthly: parseInt(e.target.value)})} /></div>
                    <div style={{flex:1}}><label>Yearly Reminder (Days)</label><input className="input" type="number" value={settings.notify_days_yearly} onChange={e=>setSettings({...settings, notify_days_yearly: parseInt(e.target.value)})} /></div>
                    <div style={{flex:1}}><label>Scan Interval (min)</label><input className="input" type="number" value={settings.scan_interval_min} onChange={e=>setSettings({...settings, scan_interval_min: parseInt(e.target.value)})} /></div>
                </div>
            </div>

            {/* 2. PAYMENT SCANNERS */}
            <div className="card">
                <h3>Payment Scanners (IMAP)</h3>
                <div className="table-container">
                    <table className="table" style={{marginBottom:'15px'}}>
                        <thead><tr><th>Type</th><th>Email</th><th>Server</th><th>Actions</th></tr></thead>
                        <tbody>
                            {Array.isArray(scanners) && scanners.map(s => (
                                <tr key={s.id}>
                                    <td><span style={{fontWeight:'bold'}}>{s.type}</span></td>
                                    <td>{s.email}</td>
                                    <td>{s.imap_server}</td>
                                    <td>
                                        <div className="flex-gap">
                                            <button className="button btn-secondary btn-sm" onClick={()=>handleTestScanner(s)}>Test</button>
                                            <button className="button btn-secondary btn-sm" onClick={()=>{setScannerForm(s); setIsEditingScanner(true);}}>Edit</button>
                                            <button className="button btn-danger btn-sm" onClick={()=>handleDeleteScanner(s.id)}>Del</button>
                                            {testResults[`scan_${s.id}`] && <span className="small">{testResults[`scan_${s.id}`]}</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div style={{borderTop:'1px solid var(--border)', paddingTop:'10px'}}>
                    <h4>{isEditingScanner ? 'Edit Scanner' : 'Add Scanner'}</h4>
                    <div className="grid-responsive" style={{marginBottom:'10px'}}>
                        <div style={{flex:1}}>
                            <label>Type</label>
                            <select className="input" value={scannerForm.type} onChange={e=>setScannerForm({...scannerForm, type: e.target.value})}>
                                <option value="Venmo">Venmo</option><option value="Zelle">Zelle</option><option value="PayPal">PayPal</option>
                            </select>
                        </div>
                        <div style={{flex:2}}><label>Email</label><input className="input" placeholder="Email" value={scannerForm.email} onChange={e=>setScannerForm({...scannerForm, email: e.target.value})} /></div>
                        <div style={{flex:2}}><label>App Password</label><input className="input" type="password" placeholder="App Password" value={scannerForm.password} onChange={e=>setScannerForm({...scannerForm, password: e.target.value})} /></div>
                    </div>
                    <div className="grid-responsive">
                        <div style={{flex:2}}><label>IMAP Server</label><input className="input" placeholder="IMAP Server" value={scannerForm.imap_server} onChange={e=>setScannerForm({...scannerForm, imap_server: e.target.value})} /></div>
                        <div style={{flex:1}}><label>Port</label><input className="input" placeholder="Port" type="number" value={scannerForm.port} onChange={e=>setScannerForm({...scannerForm, port: parseInt(e.target.value)})} /></div>
                        <div style={{flex:1, display:'flex', alignItems:'flex-end'}}>
                            <label style={{display:'flex', alignItems:'center', gap:'5px', cursor:'pointer', marginBottom:0, height:'100%'}}>
                                <input type="checkbox" checked={scannerForm.enabled} onChange={e=>setScannerForm({...scannerForm, enabled: e.target.checked})} /> Enable
                            </label>
                        </div>
                    </div>
                    <div className="flex-gap" style={{marginTop:'10px'}}>
                        <button className="button" onClick={handleSaveScanner}>Save Scanner</button>
                        {isEditingScanner && <button className="button btn-secondary" onClick={()=>{setIsEditingScanner(false); setScannerForm({id:null, type:'Venmo', email:'', password:'', imap_server:'imap.gmail.com', port:993, enabled:true});}}>Cancel</button>}
                    </div>
                </div>
            </div>

            {/* 3. PLEX SERVERS */}
            <div className="card">
                <h3>Plex Servers (For Sync)</h3>
                <div className="table-container">
                    <table className="table" style={{marginBottom:'15px'}}>
                        <thead><tr><th>Name</th><th>URL</th><th>Actions</th></tr></thead>
                        <tbody>
                            {Array.isArray(servers) && servers.map(s => (
                                <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>{s.url || 'Auto'}</td>
                                    <td>
                                        <div className="flex-gap">
                                            <button className="button btn-secondary btn-sm" onClick={()=>handleTestServer(s)}>Test</button>
                                            <button className="button btn-secondary btn-sm" onClick={()=>{setServerForm(s); setIsEditingServer(true);}}>Edit</button>
                                            <button className="button btn-danger btn-sm" onClick={()=>handleDeleteServer(s.id)}>Del</button>
                                            {testResults[s.id] && <span className="small">{testResults[s.id]}</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{borderTop:'1px solid var(--border)', paddingTop:'10px'}}>
                    <h4>{isEditingServer ? 'Edit Server' : 'Add Server'}</h4>
                    <div className="grid-responsive">
                        <div style={{flex:1}}><label>Name</label><input className="input" placeholder="Name" value={serverForm.name} onChange={e=>setServerForm({...serverForm, name: e.target.value})} /></div>
                        <div style={{flex:2}}><label>Token</label><input className="input" type="password" placeholder="X-Plex-Token" value={serverForm.token} onChange={e=>setServerForm({...serverForm, token: e.target.value})} /></div>
                        <div style={{flex:2}}><label>URL (Optional)</label><input className="input" placeholder="URL" value={serverForm.url} onChange={e=>setServerForm({...serverForm, url: e.target.value})} /></div>
                    </div>
                    <div className="flex-gap" style={{marginTop:'10px'}}>
                        <button className="button" onClick={handleSaveServer}>Save Server</button>
                        {isEditingServer && <button className="button btn-secondary" onClick={()=>{setIsEditingServer(false); setServerForm({id:null, name:'', token:'', url:''});}}>Cancel</button>}
                    </div>
                </div>
            </div>

            {/* 4. NOTIFICATIONS */}
            <div className="card">
                <h3>Notifications (SMTP)</h3>
                <div className="grid-responsive" style={{marginBottom:'10px'}}>
                    <div style={{flex:2}}><label>Host</label><input className="input" placeholder="smtp.gmail.com" value={settings.smtp_host} onChange={e=>setSettings({...settings, smtp_host: e.target.value})} /></div>
                    <div style={{flex:1}}><label>Port</label><input className="input" value={settings.smtp_port} onChange={e=>setSettings({...settings, smtp_port: e.target.value})} /></div>
                </div>
                <div className="grid-responsive">
                    <div style={{flex:1}}><label>Email</label><input className="input" value={settings.smtp_user} onChange={e=>setSettings({...settings, smtp_user: e.target.value})} /></div>
                    <div style={{flex:1}}><label>Password</label><input className="input" type="password" value={settings.smtp_pass} onChange={e=>setSettings({...settings, smtp_pass: e.target.value})} /></div>
                </div>
                <div className="flex-gap" style={{marginTop:'10px'}}>
                    <button className="button btn-secondary" onClick={handleTestSMTP}>
                        {testResults.smtp === 'Sending...' ? 'Sending...' : 'Send Test Email'}
                    </button>
                    {testResults.smtp && <span className="small">{testResults.smtp}</span>}
                </div>
            </div>

            <button className="button" onClick={handleSaveSettings} style={{width:'100%', padding:'15px', fontSize:'1.1rem'}}>Save General Settings</button>
        </div>
    );
};

export default Settings;