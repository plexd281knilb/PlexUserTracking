import React, { useState } from "react";
import { apiPost } from "../api";
import { useNavigate } from "react-router-dom";
export default function Login(){
  const [form,setForm] = useState({username:"",password:""});
  const nav = useNavigate();
  async function login(){
    const res = await apiPost("/api/admin/login", form);
    if(res.token){ localStorage.setItem("admin_token", res.token); alert("Logged in"); nav("/dashboard"); }
    else alert("Login failed");
  }
  return (
    <div className="card">
      <h3>Login</h3>
      <input className="input" placeholder="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} /><br/>
      <input className="input" type="password" placeholder="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /><br/>
      <button className="button" onClick={login}>Login</button>
    </div>
  );
}
