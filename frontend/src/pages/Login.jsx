import React, { useState } from 'react'
import { apiPost } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Login({ onLogin }){
  const [form, setForm] = useState({username:'',password:''})
  const nav = useNavigate()
  async function login(){
    const res = await apiPost('/api/admin/login', form)
    if (res.token) {
      onLogin(res.token)
      localStorage.setItem('admin_token', res.token)
      nav('/')
    } else alert('Login failed')
  }
  return (
    <div className="container card">
      <h3>Admin Login</h3>
      <input placeholder="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/>
      <input placeholder="password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
      <button onClick={login}>Login</button>
    </div>
  )
}
