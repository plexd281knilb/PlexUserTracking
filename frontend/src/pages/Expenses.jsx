import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../api";
export default function Expenses(){
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({date:"",description:"",category:"",amount:"",notes:""});
  useEffect(()=> load(), []);
  async function load(){ setRows(await apiGet("/api/expenses")); }
  async function add(){
    await apiPost("/api/expenses", form, localStorage.getItem("admin_token"));
    setForm({date:"",description:"",category:"",amount:"",notes:""});
    load();
  }
  async function update(r){
    await apiPut("/api/expenses/"+r.id, r, localStorage.getItem("admin_token"));
    load();
  }
  async function remove(r){
    if(!confirm("Delete?")) return;
    await apiDelete("/api/expenses/"+r.id, localStorage.getItem("admin_token"));
    load();
  }
  return (
    <div>
      <div className="card"><h3>Expenses</h3>
        <div className="flex">
          <input className="input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          <input className="input" placeholder="description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          <input className="input" placeholder="category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
          <input className="input" placeholder="amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} />
          <button className="button" onClick={add}>Add</button>
        </div>
        <table className="table">
          <thead><tr><th>Date</th><th>Desc</th><th>Category</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{r.date.split("T")[0]}</td>
                <td>{r.description}</td>
                <td>{r.category}</td>
                <td>${r.amount}</td>
                <td>
                  <button className="button" onClick={()=>{ const n = {...r,description: prompt("desc", r.description)||r.description}; update(n); }}>Edit</button>
                  <button className="button" onClick={()=>remove(r)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
