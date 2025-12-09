import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";
export default function Admin(){
  const [setupRequired, setSetupRequired] = useState(false);
  const [form, setForm] = useState({username:"",password:""});
  useEffect(()=>{ apiGet("/api/admin/setup-required").then(r=>setSetupRequired(r.required)).catch(()=>{}) },[]);
  async function setup(){
    await apiPost("/api/admin/setup", form);
    alert("Admin created — please login");
  }
  return (
    <div className="card">
      <h3>Admin</h3>
      {setupRequired ? (
        <div>
          <input className="input" placeholder="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} /><br/>
          <input className="input" type="password" placeholder="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /><br/>
          <button className="button" onClick={setup}>Create Admin</button>
        </div>
      ) : <div>Admin created. Use Login.</div>}
    </div>
  );
}
