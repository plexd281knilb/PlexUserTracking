import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../api"; // FIXED IMPORT
export default function ScanSettings(){
  const [cfg,setCfg]=useState({scan_interval_min:60});
  
  useEffect(()=>{ 
    apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) 
  },[]);
  
  async function save(){ 
    await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
    alert("Saved"); 
  }
  
  return (
    <div className="card">
      <h3>Payment Scanning</h3>
      
      <label className="small">Scan Interval (minutes)</label>
      <input 
          className="input" 
          type="number" 
          value={cfg.scan_interval_min} 
          onChange={e=>setCfg({...cfg,scan_interval_min:parseInt(e.target.value||0)})} 
      />
      
      <p className="small" style={{marginTop: '15px'}}>Note: If set to 0, background scanning will be disabled.</p>

      <br/><button className="button" onClick={save}>Save</button>
    </div>
  );
}