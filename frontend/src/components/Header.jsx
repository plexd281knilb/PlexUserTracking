import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Header({ authToken, setAuthToken }){
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const nav = useNavigate()

  useEffect(()=>{
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '')
    localStorage.setItem('theme', theme)
  },[theme])

  function logout(){
    localStorage.removeItem('admin_token')
    setAuthToken('')
    nav('/login')
  }

  return (
    <div className="container header">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <h2 style={{margin:0}}>PlexUserTracking</h2>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/users">Users</Link>
          <Link to="/payments/venmo">Venmo</Link>
          <Link to="/payments/zelle">Zelle</Link>
          <Link to="/payments/paypal">PayPal</Link>
          <Link to="/expenses">Expenses</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </div>
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <label className="small">Dark</label>
        <input type="checkbox" checked={theme === 'dark'} onChange={e=>setTheme(e.target.checked ? 'dark' : 'light')} />
        {authToken ? <button onClick={logout}>Logout</button> : <Link to="/login"><button>Admin</button></Link>}
      </div>
    </div>
  )
}
