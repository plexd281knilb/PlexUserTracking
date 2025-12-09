import React, { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut } from '../api'

export default function Users({ token }){
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({plex_username:'',real_name:'',emails:'',venmo:'',zelle:'',billing_amount:0,billing_frequency:'monthly'})
  useEffect(()=>{ apiGet('/api/users').then(setUsers).catch(()=>{}) },[])
  async function add(){
    await apiPost('/api/users', form, token)
    const updated = await apiGet('/api/users'); setUsers(updated)
  }
  async function save(u){
    await apiPut('/api/users/'+u.id, u, token)
    const updated = await apiGet('/api/users'); setUsers(updated)
  }
  return (
    <div className="container">
      <div className="card">
        <h3>Users</h3>
        <div style={{display:'flex', gap:8}}>
          <div style={{flex:1}}>
            {users.map(u=>(
              <div key={u.id} className="card" style={{marginBottom:8}}>
                <b>{u.plex_username}</b> ({u.real_name})<br/>
                Emails: {u.emails}<br/>
                Billing: ${u.billing_amount} / {u.billing_frequency}<br/>
                Next due: {u.next_due || '-'}<br/>
                <button onClick={()=>save({...u, billing_amount: (u.billing_amount||0)})}>Save</button>
              </div>
            ))}
          </div>
          <div style={{width:340}}>
            <h4>Add User</h4>
            <input placeholder="plex username" value={form.plex_username} onChange={e=>setForm({...form,plex_username:e.target.value})} />
            <input placeholder="real name" value={form.real_name} onChange={e=>setForm({...form,real_name:e.target.value})} />
            <input placeholder="emails (pipe-separated)" value={form.emails} onChange={e=>setForm({...form,emails:e.target.value})} />
            <input placeholder="venmo" value={form.venmo} onChange={e=>setForm({...form,venmo:e.target.value})} />
            <input placeholder="zelle" value={form.zelle} onChange={e=>setForm({...form,zelle:e.target.value})} />
            <input placeholder="billing amount" type="number" value={form.billing_amount} onChange={e=>setForm({...form,billing_amount:e.target.value})} />
            <select value={form.billing_frequency} onChange={e=>setForm({...form,billing_frequency:e.target.value})}>
              <option>monthly</option><option>quarterly</option><option>yearly</option><option>custom</option>
            </select>
            <button onClick={add}>Add</button>
          </div>
        </div>
      </div>
    </div>
  )
}
