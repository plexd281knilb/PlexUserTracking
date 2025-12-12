import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../api"; // FIXED IMPORT
export default function System(){
  // Using an object that contains all settings keys for safe merging
  const [cfg,setCfg]=useState({web_port:5052, host_url: 'http://localhost:5052'}); 

  useEffect(()=>{ 
    // This assumes the backend API provides a dedicated /api/settings/system endpoint
    apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) 
  },[]);
  
  async function save(){ 
    await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
    alert("Saved"); 
  }
  
  return (
    <div className="card">
      <h3>System Configuration</h3>
      
      <label className="small">Web Port</label>
      <input className="input" type="number" value={cfg.web_port} onChange={e=>setCfg({...cfg,web_port:parseInt(e.target.value||0)})} />

      <label className="small" style={{marginTop: '15px', display: 'block'}}>Host URL (For external links)</label>
      <input className="input" type="text" value={cfg.host_url} onChange={e=>setCfg({...cfg,host_url:e.target.value})} />
      
      <br/><button className="button" onClick={save} style={{marginTop: '15px'}}>Save</button>
    </div>
  );
}