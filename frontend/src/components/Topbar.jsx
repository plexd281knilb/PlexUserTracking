import React, { useEffect, useState } from "react";
export default function Topbar(){
  const [theme,setTheme] = useState(localStorage.getItem("theme") || "light");
  useEffect(()=> {
    if(theme==="dark") document.documentElement.setAttribute("data-theme","dark"); else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", theme);
  },[theme]);
  return (
    <div className="topbar card">
      <div> <b>Dashboard</b> </div>
      <div className="flex">
        <label className="small">Dark</label>
        <input type="checkbox" checked={theme==="dark"} onChange={e=>setTheme(e.target.checked ? "dark":"light")} />
      </div>
    </div>
  );
}
