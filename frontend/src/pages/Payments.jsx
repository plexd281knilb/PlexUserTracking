import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../api";

export default function Payments(){
  const { service } = useParams();
  const [emails, setEmails] = useState([]);
  const [rows, setRows] = useState([]);
  const [newEmail, setNewEmail] = useState({name:"",address:""});
  const [filter, setFilter] = useState({date_from:"",date_to:"",min_amt:"",max_amt:""});
  useEffect(()=> loadAll(), [service]);

  async function loadAll(){
    const e = await apiGet(`/api/payment_emails/${service}`); setEmails(e);
    const p = await apiGet(`/api/payments/${service}`); setRows(p);
  }
  async function addEmail(){
    await apiPost(`/api/payment_emails/${service}`, newEmail, localStorage.getItem("admin_token"));
    setNewEmail({name:"",address:""});
    loadAll();
  }
  async function deleteEmail(id){
    await apiDelete(`/api/payment_emails/${service}/${id}`, localStorage.getItem("admin_token"));
    loadAll();
  }
  async function filterPayments(){
    const qs = [];
    Object.entries(filter).map(([k,v])=> v && qs.push(`${k}=${encodeURIComponent(v)}`));
    const qstr = qs.length ? "?"+qs.join("&") : "";
    const p = await apiGet(`/api/payments/${service}${qstr}`);
    setRows(p);
  }
  return (
    <div>
      <div className="card"><h3>{service.toUpperCase()} — Email Accounts</h3>
        <div style={{display:"flex",gap:8}}>
          <input className="input" placeholder="name" value={newEmail.name} onChange={e=>setNewEmail({...newEmail,name:e.target.value})} />
          <input className="input" placeholder="address" value={newEmail.address} onChange={e=>setNewEmail({...newEmail,address:e.target.value})} />
          <button className="button" onClick={addEmail}>Add</button>
        </div>
        <div style={{marginTop:8}}>
          {emails.map(em => <div key={em.id} className="card" style={{marginBottom:6}}>{em.name} — {em.address} <button className="button" onClick={()=>deleteEmail(em.id)}>Delete</button></div>)}
        </div>
      </div>

      <div className="card">
        <h3>Payments</h3>
        <div className="flex">
          <input type="date" value={filter.date_from} onChange={e=>setFilter({...filter,date_from:e.target.value})} />
          <input type="date" value={filter.date_to} onChange={e=>setFilter({...filter,date_to:e.target.value})} />
          <input className="input" placeholder="min" value={filter.min_amt} onChange={e=>setFilter({...filter,min_amt:e.target.value})} />
          <input className="input" placeholder="max" value={filter.max_amt} onChange={e=>setFilter({...filter,max_amt:e.target.value})} />
          <button className="button" onClick={filterPayments}>Filter</button>
        </div>
        <table className="table">
          <thead><tr><th>Date</th><th>Payer</th><th>Amount</th><th>Notes</th></tr></thead>
          <tbody>{rows.map(r=>(
            <tr key={r.id}><td>{(r.date||"").split("T")[0]}</td><td>{r.payer}</td><td>${r.amount}</td><td>{r.notes}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
