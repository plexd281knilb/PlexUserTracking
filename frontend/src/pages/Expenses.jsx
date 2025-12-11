import React from 'react';
// Assuming Expenses component calls backend API to fetch expenses

const Expenses = () => {
    // Placeholder Data
    const expenses = [
        { id: 101, date: '2025-12-01', description: 'Plex Pass Subscription', category: 'Software', amount: 4.99 },
        { id: 102, date: '2025-11-25', description: 'New Hard Drive', category: 'Hardware', amount: 150.00 },
    ];
    
    return (
        <div>
            <h1>Expense Tracking</h1>
            <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <input type="text" placeholder="Search expenses..." />
                    <button className="btn-primary">Add Expense</button>
                </div>
                
                <table>
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
                                <td><button className="btn-primary" style={{marginRight: '5px'}}>Edit</button><button className="btn-primary" style={{backgroundColor: 'red'}}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Expenses;