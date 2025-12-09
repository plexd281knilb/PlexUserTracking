import React, { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'

export default function Home(){
  const [stats, setStats] = useState(null)
  useEffect(()=>{ apiGet('/api/stats').then(setStats).catch(()=>{}) },[])
  async function runScans(){ await apiPost('/api/scan', {}) ; alert('Scan started') }
  if (!stats) return <div className="container card">Loading...</div>
  return (
    <div className="container">
      <div className="card header">
        <h3>Overview</h3>
        <div><button onClick={runScans}>Run All Scans</button></div>
      </div>
      <div className="card stat-grid">
        <div className="stat"><h4>Total Users</h4><div>{stats.total_users}</div></div>
        <div className="stat"><h4>Email Accounts</h4><div>{stats.total_email_accounts}</div></div>
        <div className="stat"><h4>Total Payments</h4><div>{stats.total_payments}</div></div>
        <div className="stat"><h4>Total Income</h4><div>${(stats.total_income||0).toFixed(2)}</div></div>
        <div className="stat"><h4>Total Expenses</h4><div>${(stats.total_expenses||0).toFixed(2)}</div></div>
      </div>
    </div>
  )
}
