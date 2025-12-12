import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../api"; // FIXED IMPORT: was ../../api
export default function Tautulli(){
    // Initialize state with all required fields
    const [cfg,setCfg]=useState({
        plex_token: "",         
        tautulli_api_key: "",   
        tautulli_url: "",       
    });

    useEffect(()=>{ 
        apiGet("/settings").then(r=>setCfg(r)).catch(()=>{}) 
    },[]);
    
    async function save(){ 
        await apiPost("/settings", cfg, localStorage.getItem("admin_token")); 
        alert("Settings Saved"); 
    }
    
    return (
        <div className="card">
            <h3>Plex & Tautulli Integration</h3>
            
            <div style={{maxWidth: '500px', margin: '0 auto'}}>
                <div style={{borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px'}}>
                    <h4 style={{marginBottom: '5px'}}>Plex Token (Required for Disabling Users)</h4>
                    <p className="small">This token is required to interface with Plex to manage shared users.</p>
                    <input 
                        className="input" 
                        type="password" 
                        placeholder="Enter Plex Token..." 
                        value={cfg.plex_token || ''} 
                        onChange={e=>setCfg({...cfg,plex_token:e.target.value})} 
                    />
                </div>

                <div>
                    <h4 style={{marginBottom: '5px'}}>Tautulli Configuration</h4>
                    <p className="small">Required to automatically import users and track activity.</p>
                    
                    <label className="small" style={{marginTop: '10px', display: 'block'}}>Tautulli API Key</label>
                    <input 
                        className="input" 
                        type="text" 
                        placeholder="Enter Tautulli API Key..." 
                        value={cfg.tautulli_api_key || ''} 
                        onChange={e=>setCfg({...cfg,tautulli_api_key:e.target.value})}
                    />
                    
                    <label className="small" style={{marginTop: '15px', display: 'block'}}>Tautulli Base URL</label>
                    <input 
                        className="input" 
                        type="text" 
                        placeholder="e.g., http://192.168.1.10:8181"
                        value={cfg.tautulli_url || ''} 
                        onChange={e=>setCfg({...cfg,tautulli_url:e.target.value})}
                    />
                </div>
                
                <br/><button className="button" onClick={save} style={{marginTop: '20px'}}>Save All Connection Settings</button>
            </div>
        </div>
    );
}