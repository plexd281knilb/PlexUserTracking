import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "api"; // Fixed Import

export default function System(){
  const [cfg,setCfg]=useState({web_port:5052, host_url: 'http://localhost:5052'}); 

  useEffect(()=>{ apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) },[]);
  
  const save = async () => { 
    await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
    alert("Saved"); 
  };
  
  return (
    <div className="card">
      <h3>System Configuration</h3>
      <div style={{maxWidth: '500px'}}>
          <label className="small">Web Port</label>
          <input className="input" type="number" value={cfg.web_port} onChange={e=>setCfg({...cfg,web_port:parseInt(e.target.value||0)})} />

          <label className="small" style={{marginTop: '15px', display: 'block'}}>Host URL (For external links)</label>
          <input className="input" type="text" value={cfg.host_url} onChange={e=>setCfg({...cfg,host_url:e.target.value})} />
          
          <button className="button" onClick={save} style={{marginTop: '15px'}}>Save</button>
      </div>
    </div>
  );
}