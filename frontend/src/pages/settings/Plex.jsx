import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "api"; // Fixed Import

export default function Plex(){
    const [cfg,setCfg]=useState({ plex_token: "" });

    useEffect(()=>{ apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) },[]);
    
    const save = async () => { 
        await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
        alert("Plex Settings Saved"); 
    };
    
    return (
        <div className="card">
            <h3>Plex Integration</h3>
            <p className="small" style={{marginBottom: '20px'}}>
                Connecting to Plex allows the system to manage shared users directly.
            </p>
            <div style={{maxWidth: '500px'}}>
                <label className="small">Plex Admin Token (X-Plex-Token)</label>
                <input 
                    className="input" 
                    type="password" 
                    placeholder="Enter your Plex Token..." 
                    value={cfg.plex_token || ''} 
                    onChange={e=>setCfg({...cfg,plex_token:e.target.value})} 
                />
                <p className="small" style={{marginTop: '5px', fontSize: '0.8rem'}}>
                    Found in the XML of any media item in Plex Web.
                </p>
                <button className="button" onClick={save} style={{marginTop: '20px'}}>Save Plex Token</button>
            </div>
        </div>
    );
}