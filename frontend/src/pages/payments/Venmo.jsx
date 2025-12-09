import React from "react";
import PaymentsBase from "../Payments"; // reuse Payments.jsx UI if present
export default function Venmo(){
  return <div><h2>Venmo Payments</h2><PaymentsBase service="venmo" /></div>;
}
