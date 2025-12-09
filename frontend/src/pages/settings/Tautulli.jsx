import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../api";
export default function Tautulli(){
  const [cfg, setCfg] = useState({url:"",api_key:""});
  useEffect(()=>{ apiGet("/api/settings/tautulli").then(r=>setCfg(r)).catch(()=>{}) },[]);
  async function save(){ await apiPost("/api/settings/tautulli", cfg, localStorage.getItem("admin_token")); alert("Saved"); }
  return (
    <div className="card">
      <h3>Tautulli Settings</h3>
      <input className="input" placeholder="Tautulli URL" value={cfg.url} onChange={e=>setCfg({...cfg,url:e.target.value})} /><br/>
      <input className="input" placeholder="API Key" value={cfg.api_key} onChange={e=>setCfg({...cfg,api_key:e.target.value})} /><br/>
      <button className="button" onClick={save}>Save</button>
    </div>
  );
}
