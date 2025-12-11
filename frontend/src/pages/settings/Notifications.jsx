import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../api";
export default function Notifications(){
  const [cfg,setCfg]=useState({enabled:false, smtp_server:"", from_email:""});
  
  useEffect(()=>{ 
    apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) 
  },[]);
  
  async function save(){ 
    await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
    alert("Saved"); 
  }
  
  return (
    <div className="card">
      <h3>Email Reminders Setup</h3>
      
      <div className="flex" style={{marginBottom: '15px', gap: '8px'}}>
          <label className="small">Enabled</label>
          <input type="checkbox" checked={cfg.enabled} onChange={e=>setCfg({...cfg,enabled:e.target.checked})} />
      </div>

      <label className="small">SMTP Server</label>
      <input className="input" placeholder="SMTP server address" value={cfg.smtp_server} onChange={e=>setCfg({...cfg,smtp_server:e.target.value})} />
      
      <label className="small" style={{marginTop: '15px', display: 'block'}}>From Email Address</label>
      <input className="input" placeholder="From email (e.g., plex@yourdomain.com)" value={cfg.from_email} onChange={e=>setCfg({...cfg,from_email:e.target.value})} />
      
      <br/><button className="button" onClick={save} style={{marginTop: '15px'}}>Save</button>
    </div>
  );
}