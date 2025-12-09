import React from "react";
export default function AddExpenseModal({onAdd}) {
  const add = () => {
    const row = {
      date: document.getElementById("add-date").value,
      description: document.getElementById("add-desc").value,
      category: document.getElementById("add-cat").value,
      amount: document.getElementById("add-amt").value
    };
    onAdd(row);
  };
  return (
    <div className="card">
      <h4>Add Expense</h4>
      <input id="add-date" type="date" className="input" />
      <input id="add-desc" placeholder="desc" className="input" />
      <input id="add-cat" placeholder="category" className="input" />
      <input id="add-amt" placeholder="amount" className="input" />
      <button className="button" onClick={add}>Add</button>
    </div>
  );
}
