import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../api";
export default function ScanSettings(){
  const [cfg,setCfg]=useState({scan_interval_min:60});
  useEffect(()=>{ apiGet("/api/settings/scanning").then(r=>setCfg(r)).catch(()=>{}) },[]);
  async function save(){ await apiPost("/api/settings/scanning", cfg, localStorage.getItem("admin_token")); alert("Saved"); }
  return (
    <div className="card">
      <h3>Scanning</h3>
      <label className="small">Interval (min)</label>
      <input className="input" type="number" value={cfg.scan_interval_min} onChange={e=>setCfg({...cfg,scan_interval_min:parseInt(e.target.value||0)})} />
      <br/><button className="button" onClick={save}>Save</button>
    </div>
  );
}
