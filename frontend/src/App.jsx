import React, { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from './api'

export default function App(){
  const [emails, setEmails] = useState([])
  const [users, setUsers] = useState([])
  const [payments, setPayments] = useState([])
  const [settings, setSettings] = useState({})
  const [newEmail, setNewEmail] = useState({name:'', address:'', imap_server:'imap.gmail.com', imap_port:993, password:'', folder:'INBOX', search_term:'UNSEEN'})
  const [newUser, setNewUser] = useState({plex_username:'', real_name:'', emails:'', venmo:'', zelle:'', billing_amount:0, billing_frequency:'monthly'})

  useEffect(()=>{ loadAll() }, [])

  async function loadAll(){
    setEmails(await apiGet('/api/email-accounts'))
    setUsers(await apiGet('/api/users'))
    setPayments(await apiGet('/api/payments'))
    setSettings(await apiGet('/api/settings'))
  }

  async function addEmail(){
    await apiPost('/api/email-accounts', newEmail)
    setNewEmail({name:'', address:'', imap_server:'imap.gmail.com', imap_port:993, password:'', folder:'INBOX', search_term:'UNSEEN'})
    loadAll()
  }
  async function addUser(){
    await apiPost('/api/users', newUser)
    setNewUser({plex_username:'', real_name:'', emails:'', venmo:'', zelle:'', billing_amount:0, billing_frequency:'monthly'})
    loadAll()
  }

  async function triggerScan(){ await apiPost('/api/scan', {}); loadAll() }
  async function syncTautulli(){ await apiPost('/api/sync-tautulli', {}); loadAll() }
  async function disableOverdue(){ await apiPost('/api/disable-overdue', {}); loadAll() }

  async function saveSettings(){
    await apiPut('/api/settings', settings)
    loadAll()
  }

  return (
    <div style={{maxWidth:1200, margin:'20px auto', fontFamily:'Arial, sans-serif'}}>
      <h1>PlexUserTracking — Admin Dashboard</h1>

      <section style={{marginTop:20}}>
        <h2>Email Accounts</h2>
        <div style={{display:'flex', gap:12}}>
          <div style={{flex:1}}>
            {emails.map(e=>(
              <div key={e.id} style={{border:'1px solid #ddd', padding:8, marginBottom:6}}>
                <b>{e.name}</b> — {e.address}<br/>
                {e.imap_server}:{e.imap_port} • {e.folder} • {e.search_term}<br/>
                last checked: {e.last_checked || '-'}
              </div>
            ))}
          </div>
          <div style={{width:360}}>
            <h4>Add Email</h4>
            <input placeholder="name" value={newEmail.name} onChange={e=>setNewEmail({...newEmail,name:e.target.value})} style={{width:'100%'}}/>
            <input placeholder="address" value={newEmail.address} onChange={e=>setNewEmail({...newEmail,address:e.target.value})} style={{width:'100%'}}/>
            <input placeholder="password" value={newEmail.password} onChange={e=>setNewEmail({...newEmail,password:e.target.value})} style={{width:'100%'}}/>
            <input placeholder="imap server" value={newEmail.imap_server} onChange={e=>setNewEmail({...newEmail,imap_server:e.target.value})} style={{width:'100%'}}/>
            <input placeholder="search term" value={newEmail.search_term} onChange={e=>setNewEmail({...newEmail,search_term:e.target.value})} style={{width:'100%'}}/>
            <button onClick={addEmail} style={{marginTop:8}}>Add</button>
          </div>
        </div>
      </section>

      <section style={{marginTop:20}}>
        <h2>Users</h2>
        <div style={{display:'flex', gap:12}}>
          <div style={{flex:1}}>
            {users.map(u=>(
              <div key={u.id} style={{border:'1px solid #ddd', padding:8, marginBottom:6}}>
                <b>{u.plex_username}</b> ({u.real_name})<br/>
                Emails: {u.emails}<br/>
                Billing: {u.billing_amount} / {u.billing_frequency} • Next due: {u.next_due || '-'}
              </div>
            ))}
          </div>
          <div style={{width:360}}>
            <h4>Add User</h4>
            <input placeholder="plex username" value={newUser.plex_username} onChange={e=>setNewUser({...newUser,plex_username:e.target.value})} style={{width:'100%'}}/>
            <input placeholder="real name" value={newUser.real_name} onChange={e=>setNewUser({...newUser,real_name:e.target.value})} style={{width:'100%'}}/>
            <input placeholder="emails (pipe-separated)" value={newUser.emails} onChange={e=>setNewUser({...newUser,emails:e.target.value})} style={{width:'100%'}}/>
            <input placeholder="venmo name" value={newUser.venmo} onChange={e=>setNewUser({...newUser,venmo:e.target.value})} style={{width:'100%'}}/>
            <input placeholder="zelle name" value={newUser.zelle} onChange={e=>setNewUser({...newUser,zelle:e.target.value})} style={{width:'100%'}}/>
            <input placeholder="billing amount" value={newUser.billing_amount} onChange={e=>setNewUser({...newUser,billing_amount:e.target.value})} style={{width:'100%'}}/>
            <select value={newUser.billing_frequency} onChange={e=>setNewUser({...newUser,billing_frequency:e.target.value})} style={{width:'100%'}}>
              <option>monthly</option><option>quarterly</option><option>yearly</option><option>custom</option>
            </select>
            <button onClick={addUser} style={{marginTop:8}}>Add</button>
          </div>
        </div>
      </section>

      <section style={{marginTop:20}}>
        <h2>Payments</h2>
        <table style={{width:'100%', borderCollapse:'collapse'}} border="1">
          <thead><tr><th>Service</th><th>Amount</th><th>Payer</th><th>Matched</th></tr></thead>
          <tbody>
            {payments.map(p=>(
              <tr key={p.id}>
                <td>{p.service}</td><td>{p.amount}</td><td>{p.payer}</td><td>{p.matched_user_id || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{marginTop:20}}>
        <h2>Settings & Actions</h2>
        <div style={{display:'flex', gap:12}}>
          <div style={{flex:1}}>
            <h4>Settings</h4>
            <label>Web port: <input value={settings.WEB_PORT || ''} onChange={e=>setSettings({...settings, WEB_PORT:e.target.value})}/></label><br/>
            <label>Scan interval (min): <input value={settings.SCAN_INTERVAL_MIN || ''} onChange={e=>setSettings({...settings, SCAN_INTERVAL_MIN:e.target.value})}/></label><br/>
            <label>Grace days: <input value={settings.GRACE_DAYS || ''} onChange={e=>setSettings({...settings, GRACE_DAYS:e.target.value})}/></label><br/>
            <button onClick={saveSettings}>Save Settings</button>
          </div>
          <div style={{width:360}}>
            <h4>Actions</h4>
            <button onClick={triggerScan}>Run Scan Now</button><br/>
            <button onClick={syncTautulli}>Sync Tautulli</button><br/>
            <button onClick={disableOverdue}>Disable Overdue</button>
          </div>
        </div>
      </section>
    </div>
  )
}
