import React from 'react';

const Dashboard = () => {
    // Placeholder Data - This will eventually pull from backend/routes/dashboard.py
    const summary = {
        users: { total: 42, active: 38 },
        income: { month: 350.00, ytd: 1500.00 },
        expense: { ytd: 200.00 },
    };

    const StatCard = ({ title, value, sub, color }) => (
        <div className="card" style={{flex: 1, textAlign: 'center', borderTop: `4px solid ${color}`}}>
            <h3 style={{fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px'}}>{title}</h3>
            <h2 style={{fontSize: '2rem', margin: '10px 0', color: 'var(--text-main)'}}>{value}</h2>
            <p className="small" style={{color: color}}>{sub}</p>
        </div>
    );

    return (
        <div>
            <h1 style={{marginBottom: '20px'}}>Dashboard Overview</h1>
            
            {/* Top Stats Row */}
            <div className="flex" style={{marginBottom: '20px', alignItems: 'stretch'}}>
                <StatCard title="Total Users" value={summary.users.total} sub={`${summary.users.active} Active`} color="var(--accent)" />
                <StatCard title="Monthly Revenue" value={`$${summary.income.month}`} sub="+12% vs last month" color="#10b981" /> {/* Green */}
                <StatCard title="YTD Expenses" value={`$${summary.expense.ytd}`} sub="Hosting & Domains" color="#ef4444" /> {/* Red */}
                <StatCard title="Net Profit" value={`$${summary.income.ytd - summary.expense.ytd}`} sub="Year to Date" color="var(--accent)" />
            </div>

            {/* Recent Activity Table */}
            <div className="card">
                <h3>Recent Activity</h3>
                <table className="table">
                    <thead>
                        <tr><th>Date</th><th>User</th><th>Action</th><th>Amount</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Today</td><td>Alice Smith</td><td>Venmo Payment</td><td style={{color: '#10b981'}}>+$15.00</td><td>Processed</td></tr>
                        <tr><td>Yesterday</td><td>Bob Jones</td><td>Plex Import</td><td>-</td><td>Completed</td></tr>
                        <tr><td>Dec 10</td><td>Charlie Day</td><td>PayPal Payment</td><td style={{color: '#10b981'}}>+$10.00</td><td>Processed</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;