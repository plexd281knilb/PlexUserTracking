import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from 'api';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [newItem, setNewItem] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0], // Default to today
        category: 'One-time'
    });

    const fetchExpenses = async () => {
        try {
            const data = await apiGet('/expenses');
            setExpenses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItem.description || !newItem.amount) return;

        try {
            await apiPost('/expenses', newItem, localStorage.getItem('admin_token'));
            // Reset form but keep date
            setNewItem({ ...newItem, description: '', amount: '' });
            fetchExpenses();
        } catch (error) {
            alert('Failed to save expense');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await apiDelete(`/expenses/${id}`, localStorage.getItem('admin_token'));
            fetchExpenses();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    // Calculate Total
    const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    return (
        <div>
            <h1>Expense Tracking</h1>
            <p className="small" style={{marginBottom: '20px'}}>Track server costs, domain renewals, and hardware upgrades.</p>

            <div className="flex" style={{alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap'}}>
                
                {/* List of Expenses */}
                <div className="card" style={{flex: 2, minWidth: '300px'}}>
                    <div className="flex" style={{justifyContent: 'space-between', marginBottom: '15px'}}>
                        <h3>History</h3>
                        <span style={{fontWeight: 'bold', color: 'var(--danger)'}}>
                            Total: ${totalExpenses.toFixed(2)}
                        </span>
                    </div>
                    
                    {loading ? <p>Loading...</p> : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(ex => (
                                    <tr key={ex.id}>
                                        <td>{ex.date}</td>
                                        <td>{ex.description}</td>
                                        <td>
                                            <span style={{
                                                fontSize: '0.8rem', 
                                                padding: '2px 8px', 
                                                borderRadius: '4px',
                                                backgroundColor: ex.category === 'Recurring' ? '#3b82f6' : '#64748b',
                                                color: 'white'
                                            }}>
                                                {ex.category}
                                            </span>
                                        </td>
                                        <td>${parseFloat(ex.amount).toFixed(2)}</td>
                                        <td>
                                            <button 
                                                className="button" 
                                                style={{backgroundColor: 'var(--danger)', padding: '4px 8px', fontSize: '0.8rem'}}
                                                onClick={() => handleDelete(ex.id)}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No expenses recorded.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Add New Expense Form */}
                <div className="card" style={{flex: 1, minWidth: '250px', position: 'sticky', top: '20px'}}>
                    <h3>Add New Expense</h3>
                    <form onSubmit={handleAdd} style={{display: 'grid', gap: '15px'}}>
                        <div>
                            <label className="small">Description</label>
                            <input 
                                className="input" 
                                placeholder="e.g. Domain Renewal" 
                                value={newItem.description} 
                                onChange={e => setNewItem({...newItem, description: e.target.value})} 
                                required 
                            />
                        </div>

                        <div className="flex">
                            <div style={{flex: 1}}>
                                <label className="small">Amount ($)</label>
                                <input 
                                    className="input" 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0.00" 
                                    value={newItem.amount} 
                                    onChange={e => setNewItem({...newItem, amount: e.target.value})} 
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="small">Date</label>
                            <input 
                                className="input" 
                                type="date" 
                                value={newItem.date} 
                                onChange={e => setNewItem({...newItem, date: e.target.value})} 
                                required 
                            />
                        </div>

                        <div>
                            <label className="small">Category</label>
                            <select 
                                className="input" 
                                value={newItem.category} 
                                onChange={e => setNewItem({...newItem, category: e.target.value})}
                            >
                                <option value="One-time">One-time Purchase</option>
                                <option value="Recurring">Monthly / Recurring</option>
                                <option value="Hardware">Hardware Upgrade</option>
                            </select>
                        </div>

                        <button type="submit" className="button" style={{marginTop: '10px'}}>
                            Add Expense
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Expenses;