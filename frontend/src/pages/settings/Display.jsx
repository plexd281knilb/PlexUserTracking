import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../api";
export default function Display(){
  const [cfg, setCfg] = useState({theme:"light"});
  useEffect(()=>{ apiGet("/api/settings/appearance").then(r=>setCfg(r)).catch(()=>{}) },[]);
  async function save(){ await apiPost("/api/settings/appearance", cfg, localStorage.getItem("admin_token")); alert("Saved"); }
  return (
    <div className="card">
      <h3>Appearance</h3>
      <label className="small">Theme</label>
      <select value={cfg.theme} onChange={e=>setCfg({...cfg,theme:e.target.value})} className="input">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <br/><button className="button" onClick={save}>Save</button>
    </div>
  );
}
