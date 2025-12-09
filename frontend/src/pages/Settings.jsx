import React, { useEffect, useState } from 'react'
import { apiGet, apiPut } from '../api'

export default function Settings({ token }){
  const [settings, setSettings] = useState({})
  useEffect(()=>{ apiGet('/api/settings').then(setSettings).catch(()=>{}) },[])
  async function save(){
    await apiPut('/api/settings', settings, token)
    alert('Saved')
  }
  return (
    <div className="container card">
      <h3>Settings</h3>
      <div className="form-row">
        <input placeholder="TAUTULLI_URL" value={settings.TAUTULLI_URL||''} onChange={e=>setSettings({...settings, TAUTULLI_URL:e.target.value})}/>
        <input placeholder="TAUTULLI_API_KEY" value={settings.TAUTULLI_API_KEY||''} onChange={e=>setSettings({...settings, TAUTULLI_API_KEY:e.target.value})}/>
      </div>
      <div className="form-row">
        <input placeholder="SCAN_INTERVAL_MIN" value={settings.SCAN_INTERVAL_MIN||''} onChange={e=>setSettings({...settings, SCAN_INTERVAL_MIN:e.target.value})}/>
        <input placeholder="GRACE_DAYS" value={settings.GRACE_DAYS||''} onChange={e=>setSettings({...settings, GRACE_DAYS:e.target.value})}/>
      </div>
      <div style={{marginTop:12}}>
        <button onClick={save}>Save Settings</button>
      </div>
    </div>
  )
}
