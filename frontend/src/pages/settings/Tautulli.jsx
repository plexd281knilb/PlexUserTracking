import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "api";

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
            <div style={{display: 'grid', gap: '20px', maxWidth: '500px'}}>
                <div>
                    <label className="small">Plex Admin Token</label>
                    <input className="input" type="password" value={cfg.plex_token || ''} onChange={e=>setCfg({...cfg,plex_token:e.target.value})} />
                </div>
                <div>
                    <label className="small">Tautulli API Key</label>
                    <input className="input" type="text" value={cfg.tautulli_api_key || ''} onChange={e=>setCfg({...cfg,tautulli_api_key:e.target.value})} />
                </div>
                <div>
                    <label className="small">Tautulli URL</label>
                    <input className="input" placeholder="http://192.168.1.10:8181" value={cfg.tautulli_url || ''} onChange={e=>setCfg({...cfg,tautulli_url:e.target.value})} />
                </div>
                <button className="button" onClick={save}>Update Tokens</button>
            </div>
        </div>
    );
}