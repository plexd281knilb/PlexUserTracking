import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";
export default function Dashboard(){
  const [summary, setSummary] = useState(null);
  useEffect(()=>{ apiGet("/api/dashboard/summary").then(setSummary).catch(()=>{}) },[]);
  async function runScan(){
    await apiPost("/api/scan/run", {}, localStorage.getItem("admin_token"));
    alert("Scan triggered");
  }
  if(!summary) return <div className="card">Loading...</div>;
  return (
    <div>
      <div className="card">
        <h2>Overview</h2>
        <div style={{display:"flex",gap:12}}>
          <div className="card" style={{padding:12}}><h4>Total users</h4><div>{summary.total_users}</div></div>
          <div className="card" style={{padding:12}}><h4>Email accounts</h4><div>{summary.total_email_accounts}</div></div>
          <div className="card" style={{padding:12}}><h4>Payments</h4><div>{summary.total_payments}</div></div>
          <div style={{marginLeft:"auto"}}><button className="button" onClick={runScan}>Run Scans</button></div>
        </div>
      </div>
    </div>
  );
}
