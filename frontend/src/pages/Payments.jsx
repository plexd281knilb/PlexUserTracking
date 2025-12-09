import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiGet, apiPost } from '../api'

export default function Payments({ token }){
  const { service } = useParams()
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState({date_from:'',date_to:'',min_amt:'',max_amt:''})
  useEffect(()=>{ load() },[service])
  async function load(){
    const qs = []
    Object.entries(filter).forEach(([k,v])=> v && qs.push(`${k}=${encodeURIComponent(v)}`))
    const qstr = qs.length ? '?'+qs.join('&') : ''
    const res = await apiGet(`/api/payments/service/${service}${qstr}`)
    setRows(res)
  }
  return (
    <div className="container">
      <div className="card">
        <h3>{service.toUpperCase()} Payments</h3>
        <div className="form-row">
          <input type="date" value={filter.date_from} onChange={e=>setFilter({...filter,date_from:e.target.value})}/>
          <input type="date" value={filter.date_to} onChange={e=>setFilter({...filter,date_to:e.target.value})}/>
          <input placeholder="min" value={filter.min_amt} onChange={e=>setFilter({...filter,min_amt:e.target.value})}/>
          <input placeholder="max" value={filter.max_amt} onChange={e=>setFilter({...filter,max_amt:e.target.value})}/>
          <button onClick={load}>Filter</button>
        </div>
        <table className="table">
          <thead><tr><th>Date</th><th>Payer</th><th>Amount</th><th>Matched</th></tr></thead>
          <tbody>{rows.map(r=>(
            <tr key={r.id}><td>{r.date}</td><td>{r.payer}</td><td>{r.amount}</td><td>{r.matched_user_id||'-'}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
