import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "api"; // Fixed Import

export default function Notifications(){
  const [cfg,setCfg]=useState({enabled:false, smtp_server:"", smtp_port: 587, from_email:"", app_password: ""});
  
  useEffect(()=>{ apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) },[]);
  
  const save = async () => { 
    await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
    alert("Saved"); 
  };
  
  return (
    <div className="card">
      <h3>Email Reminders Setup</h3>
      <div className="flex" style={{marginBottom: '15px', gap: '8px'}}>
          <input type="checkbox" checked={cfg.enabled} onChange={e=>setCfg({...cfg,enabled:e.target.checked})} style={{width:'auto'}}/>
          <label className="small">Enable Automatic Reminders</label>
      </div>

      <div style={{maxWidth: '500px'}}>
          <label className="small">SMTP Server</label>
          <input className="input" placeholder="smtp.gmail.com" value={cfg.smtp_server || ''} onChange={e=>setCfg({...cfg,smtp_server:e.target.value})} />
          
          <div className="flex" style={{marginTop: '15px'}}>
              <div style={{flex: 1}}>
                  <label className="small">Port</label>
                  <input className="input" type="number" value={cfg.smtp_port} onChange={e=>setCfg({...cfg,smtp_port:parseInt(e.target.value || 0)})} />
              </div>
              <div style={{flex: 3}}>
                  <label className="small">From Email</label>
                  <input className="input" placeholder="plex@domain.com" value={cfg.from_email || ''} onChange={e=>setCfg({...cfg,from_email:e.target.value})} />
              </div>
          </div>
          
          <label className="small" style={{marginTop: '15px', display: 'block'}}>App Password / Token</label>
          <input className="input" type="password" placeholder="Email Account App Password" value={cfg.app_password || ''} onChange={e=>setCfg({...cfg,app_password:e.target.value})} />
          
          <button className="button" onClick={save} style={{marginTop: '15px'}}>Save Connection Settings</button>
      </div>
    </div>
  );
}