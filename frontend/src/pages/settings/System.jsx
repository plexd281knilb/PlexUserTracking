import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../api";
export default function System(){
  const [cfg,setCfg]=useState({web_port:5050});
  useEffect(()=>{ apiGet("/api/settings/general").then(r=>setCfg(r)).catch(()=>{}) },[]);
  async function save(){ await apiPost("/api/settings/general", cfg, localStorage.getItem("admin_token")); alert("Saved"); }
  return (
    <div className="card">
      <h3>System</h3>
      <label className="small">Web port</label>
      <input className="input" type="number" value={cfg.web_port} onChange={e=>setCfg({...cfg,web_port:parseInt(e.target.value||0)})} />
      <br/><button className="button" onClick={save}>Save</button>
    </div>
  );
}
