import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "api"; // Clean Absolute Import

export default function Tautulli(){
    const [cfg,setCfg]=useState({ plex_token: "", tautulli_api_key: "", tautulli_url: "" });

    useEffect(()=>{ apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) },[]);
    
    const save = async () => { 
        await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
        alert("Integrations Saved"); 
    };
    
    return (
        <div className="card">
            <h3>Plex & Tautulli Integration</h3>
            <div style={{maxWidth: '500px'}}>
                <label className="small">Plex Admin Token (Required to Disable Users)</label>
                <input className="input" type="password" value={cfg.plex_token || ''} onChange={e=>setCfg({...cfg,plex_token:e.target.value})} />
                
                <label className="small" style={{marginTop:'15px', display:'block'}}>Tautulli API Key</label>
                <input className="input" value={cfg.tautulli_api_key || ''} onChange={e=>setCfg({...cfg,tautulli_api_key:e.target.value})} />
                
                <label className="small" style={{marginTop:'15px', display:'block'}}>Tautulli URL</label>
                <input className="input" placeholder="http://192.168.1.10:8181" value={cfg.tautulli_url || ''} onChange={e=>setCfg({...cfg,tautulli_url:e.target.value})} />
                
                <button className="button" onClick={save} style={{marginTop: '20px'}}>Save Connections</button>
            </div>
        </div>
    );
}