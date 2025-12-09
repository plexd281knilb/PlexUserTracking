import React from "react";
import PaymentsBase from "../Payments";
export default function Paypal(){
  return <div><h2>PayPal Payments</h2><PaymentsBase service="paypal" /></div>;
}
