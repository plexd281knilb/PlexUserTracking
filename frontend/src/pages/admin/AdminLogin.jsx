import React, { useState } from "react";
import { apiPost } from "../../api";
import { useNavigate } from "react-router-dom";
export default function AdminLogin(){
  const [form,setForm]=useState({username:"",password:""});
  const nav = useNavigate();
  async function login(){
    const r = await apiPost("/api/admin/login", form);
    if (r.token) {
      localStorage.setItem("admin_token", r.token);
      nav("/dashboard");
    } else {
      alert("Login failed");
    }
  }
  return (
    <div className="card">
      <h3>Admin Login</h3>
      <input className="input" placeholder="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
      <input className="input" type="password" placeholder="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
      <button className="button" onClick={login}>Login</button>
    </div>
  );
}
