import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../api";
export default function Notifications(){
  const [cfg,setCfg]=useState({enabled:false, smtp_server:"", from_email:""});
  useEffect(()=>{ apiGet("/api/settings/email").then(r=>setCfg(r)).catch(()=>{}) },[]);
  async function save(){ await apiPost("/api/settings/email", cfg, localStorage.getItem("admin_token")); alert("Saved"); }
  return (
    <div className="card">
      <h3>Email Reminders</h3>
      <label className="small">Enabled</label>
      <input type="checkbox" checked={cfg.enabled} onChange={e=>setCfg({...cfg,enabled:e.target.checked})} />
      <br/>
      <input className="input" placeholder="SMTP server" value={cfg.smtp_server} onChange={e=>setCfg({...cfg,smtp_server:e.target.value})} />
      <input className="input" placeholder="From email" value={cfg.from_email} onChange={e=>setCfg({...cfg,from_email:e.target.value})} />
      <br/><button className="button" onClick={save}>Save</button>
    </div>
  );
}
