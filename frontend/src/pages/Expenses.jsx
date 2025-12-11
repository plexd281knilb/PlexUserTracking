import React from 'react';

const Expenses = () => {
    // Placeholder Data
    const expenses = [
        { id: 101, date: '2025-12-01', description: 'Plex Pass Subscription', category: 'Software', amount: 4.99 },
        { id: 102, date: '2025-11-25', description: 'New Hard Drive', category: 'Hardware', amount: 150.00 },
    ];
    
    return (
        <div>
            <h1>Expense Tracking</h1>
            <div className="card">
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <input className="input" type="text" placeholder="Search expenses..." />
                    <button className="button">Add Expense</button>
                </div>
                
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(expense => (
                            <tr key={expense.id}>
                                <td>{expense.date}</td>
                                <td>{expense.description}</td>
                                <td>{expense.category}</td>
                                <td style={{color: 'red'}}>${expense.amount.toFixed(2)}</td>
                                <td>
                                    <button className="button" style={{marginRight: '5px', padding: '6px 8px'}}>Edit</button>
                                    <button className="button" style={{backgroundColor: 'red', padding: '6px 8px'}}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Expenses;