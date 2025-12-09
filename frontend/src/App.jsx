import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Expenses from './pages/Expenses'
import Users from './pages/Users'
import Payments from './pages/Payments'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Header from './components/Header'
import { apiGet } from './api'

export default function App(){
  const [adminSet, setAdminSet] = useState(false)
  const [authToken, setAuthToken] = useState(localStorage.getItem('admin_token') || '')

  useEffect(()=>{
    fetch('/api/admin/setup-required').then(r=>r.json()).then(j=>setAdminSet(!j.required))
  },[])

  function onLogin(token){
    setAuthToken(token)
    localStorage.setItem('admin_token', token)
  }

  return (
    <BrowserRouter>
      <Header authToken={authToken} setAuthToken={setAuthToken}/>
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login onLogin={onLogin} />} />
          <Route path="/" element={<Home />} />
          <Route path="/expenses" element={<Expenses token={authToken} />} />
          <Route path="/users" element={<Users token={authToken} />} />
          <Route path="/payments/:service" element={<Payments token={authToken} />} />
          <Route path="/settings" element={<Settings token={authToken} />} />
          <Route path="/admin" element={<Admin token={authToken} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
