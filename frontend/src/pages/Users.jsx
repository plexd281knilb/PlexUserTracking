import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut } from "../api";
export default function Users(){
  const [users,setUsers] = useState([]);
  const [form,setForm] = useState({plex_username:"",real_name:"",emails:"",venmo:"",zelle:"",billing_amount:0,billing_frequency:"monthly"});
  useEffect(()=>{ apiGet("/api/users").then(setUsers).catch(()=>{}) },[]);
  async function add(){
    await apiPost("/api/users", form, localStorage.getItem("admin_token"));
    setForm({plex_username:"",real_name:"",emails:"",venmo:"",zelle:"",billing_amount:0,billing_frequency:"monthly"});
    setUsers(await apiGet("/api/users"));
  }
  async function save(u){
    await apiPut("/api/users/"+u.id, u, localStorage.getItem("admin_token"));
    setUsers(await apiGet("/api/users"));
  }
  return (
    <div>
      <div className="card"><h3>Users</h3>
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:1}}>
            {users.map(u=>(
              <div className="card" key={u.id} style={{marginBottom:8}}>
                <b>{u.plex_username}</b> ({u.real_name}) <br/>
                Emails: {u.emails} <br/>
                Billing: ${u.billing_amount} / {u.billing_frequency} <br/>
                <button className="button" onClick={()=>save(u)}>Save</button>
              </div>
            ))}
          </div>
          <div style={{width:320}}>
            <h4>Add User</h4>
            <input className="input" placeholder="plex username" value={form.plex_username} onChange={e=>setForm({...form,plex_username:e.target.value})} /><br/>
            <input className="input" placeholder="real name" value={form.real_name} onChange={e=>setForm({...form,real_name:e.target.value})} /><br/>
            <input className="input" placeholder="emails (pipe-separated)" value={form.emails} onChange={e=>setForm({...form,emails:e.target.value})} /><br/>
            <input className="input" placeholder="venmo" value={form.venmo} onChange={e=>setForm({...form,venmo:e.target.value})} /><br/>
            <input className="input" placeholder="zelle" value={form.zelle} onChange={e=>setForm({...form,zelle:e.target.value})} /><br/>
            <input className="input" placeholder="billing amount" type="number" value={form.billing_amount} onChange={e=>setForm({...form,billing_amount:e.target.value})} /><br/>
            <select value={form.billing_frequency} onChange={e=>setForm({...form,billing_frequency:e.target.value})}>
              <option>monthly</option><option>quarterly</option><option>yearly</option><option>custom</option>
            </select><br/><br/>
            <button className="button" onClick={add}>Add User</button>
          </div>
        </div>
      </div>
    </div>
  );
}
