import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../api"; // FIXED IMPORT
export default function Notifications(){
  const [cfg,setCfg]=useState({enabled:false, smtp_server:"", smtp_port: 587, from_email:"", app_password: ""});
  
  useEffect(()=>{ 
    apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) 
  },[]);
  
  async function save(){ 
    await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
    alert("Settings Saved"); 
  }
  
  return (
    <div className="card">
      <h3>Email Reminders Setup</h3>
      
      <div className="flex" style={{marginBottom: '15px', gap: '8px'}}>
          <label className="small">Notifications Enabled</label>
          <input type="checkbox" checked={cfg.enabled} onChange={e=>setCfg({...cfg,enabled:e.target.checked})} />
      </div>

      <label className="small">SMTP Server</label>
      <input className="input" placeholder="SMTP server address" value={cfg.smtp_server || ''} onChange={e=>setCfg({...cfg,smtp_server:e.target.value})} />
      
      <div className="flex" style={{marginTop: '15px'}}>
          <div style={{flex: 2}}>
              <label className="small">SMTP Port</label>
              <input className="input" type="number" placeholder="Port (e.g., 587)" value={cfg.smtp_port} onChange={e=>setCfg({...cfg,smtp_port:parseInt(e.target.value || 0)})} />
          </div>
          <div style={{flex: 3}}>
              <label className="small">From Email Address</label>
              <input className="input" placeholder="From email (e.g., plex@mydomain.com)" value={cfg.from_email || ''} onChange={e=>setCfg({...cfg,from_email:e.target.value})} />
          </div>
      </div>
      
      <label className="small" style={{marginTop: '15px', display: 'block'}}>App Password / Token</label>
      <input className="input" type="password" placeholder="Email Account App Password (RECOMMENDED)" value={cfg.app_password || ''} onChange={e=>setCfg({...cfg,app_password:e.target.value})} />
      
      <br/><button className="button" onClick={save} style={{marginTop: '15px'}}>Save Connection Settings</button>
    </div>
  );
}