import React from "react";
export default function EditExpenseModal({expense, onSave}) {
  if (!expense) return null;
  const save = () => {
    const updated = {...expense};
    const amt = parseFloat(document.getElementById("edit-amt").value||"0");
    updated.amount = amt.toString();
    updated.description = document.getElementById("edit-desc").value;
    updated.category = document.getElementById("edit-cat").value;
    onSave(updated);
  };
  return (
    <div className="card">
      <h4>Edit Expense</h4>
      <input id="edit-desc" defaultValue={expense.description} className="input" />
      <input id="edit-cat" defaultValue={expense.category} className="input" />
      <input id="edit-amt" defaultValue={expense.amount} className="input" />
      <button className="button" onClick={save}>Save</button>
    </div>
  );
}
