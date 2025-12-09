import React from "react";
import { useNavigate } from "react-router-dom";
export default function PaymentsBase({service}) {
  // fallback UI if service provided as prop, else instruct user to pick one
  return (
    <div>
      <h3>{service ? service.toUpperCase() + " Payments" : "Payments"}</h3>
      <p>Use the dedicated page: /payments/venmo, /payments/zelle, /payments/paypal</p>
    </div>
  );
}
