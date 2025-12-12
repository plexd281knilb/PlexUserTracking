import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "api";

export default function Tautulli(){
    const [cfg,setCfg]=useState({ tautulli_api_key: "", tautulli_url: "" });

    useEffect(()=>{ apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) },[]);
    
    const save = async () => { 
        await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
        alert("Tautulli Settings Saved"); 
    };
    
    return (
        <div className="card">
            <h3>Tautulli Integration</h3>
            <p className="small" style={{marginBottom: '20px'}}>
                Tautulli is used to import user lists and track watch statistics.
            </p>

            <div style={{maxWidth: '500px'}}>
                <label className="small">Tautulli API Key</label>
                <input 
                    className="input" 
                    type="text" 
                    value={cfg.tautulli_api_key || ''} 
                    onChange={e=>setCfg({...cfg,tautulli_api_key:e.target.value})} 
                />
                
                <label className="small" style={{marginTop:'15px', display:'block'}}>Tautulli Base URL</label>
                <input 
                    className="input" 
                    type="text" 
                    placeholder="http://192.168.1.10:8181" 
                    value={cfg.tautulli_url || ''} 
                    onChange={e=>setCfg({...cfg,tautulli_url:e.target.value})} 
                />
                
                <button className="button" onClick={save} style={{marginTop: '20px'}}>Save Tautulli Settings</button>
            </div>
        </div>
    );
}