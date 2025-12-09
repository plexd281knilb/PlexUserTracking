import React, { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'

export default function Expenses({ token }){
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({description:'',category:'',amount:''})
  useEffect(()=>{ apiGet('/api/expenses').then(setRows).catch(()=>{}) },[])
  async function add(){
    await apiPost('/api/expenses', form, token)
    setForm({description:'',category:'',amount:''})
    setRows((r)=>[...r]) // simple; reload instead
    const updated = await apiGet('/api/expenses'); setRows(updated)
  }
  return (
    <div className="container">
      <div className="card">
        <h3>Expenses</h3>
        <div className="form-row">
          <input placeholder="description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          <input placeholder="category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
          <input placeholder="amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} />
          <button onClick={add}>Add</button>
        </div>
        <table className="table">
          <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
          <tbody>{rows.map(r=>(
            <tr key={r.id}><td>{new Date(r.date).toLocaleDateString()}</td><td>{r.description}</td><td>{r.category}</td><td>${r.amount}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
