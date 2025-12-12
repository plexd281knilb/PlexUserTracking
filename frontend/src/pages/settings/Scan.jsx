import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "api"; // Fixed Import

export default function ScanSettings(){
  const [cfg,setCfg]=useState({scan_interval_min:60});
  
  useEffect(()=>{ apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) },[]);
  
  const save = async () => { 
    await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
    alert("Saved"); 
  };
  
  return (
    <div className="card">
      <h3>Payment Scanning</h3>
      <div style={{maxWidth: '500px'}}>
          <label className="small">Scan Interval (minutes)</label>
          <input className="input" type="number" value={cfg.scan_interval_min} onChange={e=>setCfg({...cfg,scan_interval_min:parseInt(e.target.value||0)})} />
          <p className="small" style={{marginTop: '10px'}}>Set to 0 to disable background scanning.</p>
          <button className="button" onClick={save} style={{marginTop: '10px'}}>Save</button>
      </div>
    </div>
  );
}