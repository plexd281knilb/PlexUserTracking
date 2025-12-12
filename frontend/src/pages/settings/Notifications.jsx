import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "api"; // Clean Import

export default function Notifications(){
  const [cfg,setCfg]=useState({enabled:false, smtp_server:"", smtp_port: 587, from_email:"", app_password: ""});
  
  useEffect(()=>{ apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) },[]);
  
  const save = async () => { 
    await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
    alert("Saved"); 
  };
  
  return (
    <div className="card">
      <h3>Email Notifications</h3>
      <div className="flex" style={{marginBottom: '20px'}}>
          <label>Enable Reminders</label>
          <input type="checkbox" checked={cfg.enabled} onChange={e=>setCfg({...cfg,enabled:e.target.checked})} />
      </div>
      <div style={{display: 'grid', gap: '15px'}}>
        <input className="input" placeholder="SMTP Server" value={cfg.smtp_server || ''} onChange={e=>setCfg({...cfg,smtp_server:e.target.value})} />
        <input className="input" type="number" placeholder="Port (587)" value={cfg.smtp_port} onChange={e=>setCfg({...cfg,smtp_port:parseInt(e.target.value)})} />
        <input className="input" placeholder="From Email" value={cfg.from_email || ''} onChange={e=>setCfg({...cfg,from_email:e.target.value})} />
        <input className="input" type="password" placeholder="App Password" value={cfg.app_password || ''} onChange={e=>setCfg({...cfg,app_password:e.target.value})} />
        <button className="button" onClick={save}>Save Settings</button>
      </div>
    </div>
  );
}