import React, { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'

export default function Admin({ token }){
  const [setupRequired, setSetupRequired] = useState(false)
  const [form, setForm] = useState({username:'',password:''})
  useEffect(()=>{ apiGet('/api/admin/setup-required').then(j=>setSetupRequired(j.required)).catch(()=>{}) },[])
  async function setup(){
    const res = await apiPost('/api/admin/setup', form)
    if (res.token) {
      localStorage.setItem('admin_token', res.token)
      alert('Admin created')
    } else alert('error')
  }
  return (
    <div className="container card">
      <h3>Admin</h3>
      {setupRequired ? (
        <>
          <p>First time setup — create admin user</p>
          <input placeholder="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/>
          <input placeholder="password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
          <button onClick={setup}>Create Admin</button>
        </>
      ) : (
        <p>Admin already created. Use Login page to authenticate.</p>
      )}
    </div>
  )
}
