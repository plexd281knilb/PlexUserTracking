import React, { useState } from "react";
import { apiPost } from "../../api";
export default function AdminSetup(){
  const [form,setForm]=useState({username:"",password:""});
  async function doSetup(){
    await apiPost("/api/admin/setup", form);
    alert("Admin created. Please login.");
  }
  return (
    <div className="card">
      <h3>Admin Setup</h3>
      <input className="input" placeholder="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
      <input className="input" type="password" placeholder="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
      <button className="button" onClick={doSetup}>Create Admin</button>
    </div>
  );
}
