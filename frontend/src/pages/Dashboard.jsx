import React from 'react';

const Dashboard = () => {
    // Placeholder Data
    const summary = {
        totalUsers: 42,
        paidUsers: 38,
        totalPayments: 1500.00,
        totalExpenses: 200.00,
        paymentsThisMonth: 350.00,
    };

    const Card = ({ title, value, detail, color = 'var(--text)' }) => (
        <div className="card" style={{ flex: 1, padding: '20px', margin: '0 10px' }}>
            <p className="small" style={{ margin: '0 0 5px 0', textTransform: 'uppercase' }}>{title}</p>
            <h3 style={{ margin: '0 0 5px 0', color: color }}>{value}</h3>
            {detail && <p className="small" style={{ margin: 0 }}>{detail}</p>}
        </div>
    );

    return (
        <div>
            <h1>System Dashboard</h1>
            
            {/* Summary Cards */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '20px' }}>
                <Card 
                    title="Total Users" 
                    value={summary.totalUsers} 
                    detail={`${summary.paidUsers} Paid`} 
                    color="var(--accent)"
                />
                <Card 
                    title="Payments (Mo)" 
                    value={`$${summary.paymentsThisMonth.toFixed(2)}`} 
                    detail="This month's income"
                    color="green"
                />
                <Card 
                    title="Total Expenses (YTD)" 
                    value={`$${summary.totalExpenses.toFixed(2)}`} 
                    detail="Annual overhead" 
                    color="red"
                />
                <Card 
                    title="Net Income (YTD)" 
                    value={`$${(summary.totalPayments - summary.totalExpenses).toFixed(2)}`} 
                    detail="Total profit"
                    color="var(--accent)"
                />
            </div>

            {/* Recent Activity/Table */}
            <div className="card">
                <h2>Recent Payments</h2>
                <p className="small">Last 5 payments processed by the email scanners.</p>
                
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>User</th>
                            <th>Service</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>2025-12-11</td><td>B. Johnson</td><td>Venmo</td><td style={{color: 'green'}}>$25.00</td><td>Processed</td></tr>
                        <tr><td>2025-12-10</td><td>A. Smith</td><td>PayPal</td><td style={{color: 'green'}}>$10.00</td><td>Processed</td></tr>
                        <tr><td>2025-12-09</td><td>C. Doe</td><td>Zelle</td><td style={{color: 'green'}}>$25.00</td><td>Processed</td></tr>
                        <tr><td>2025-12-05</td><td>E. Frank</td><td>Venmo</td><td style={{color: 'orange'}}>$25.00</td><td>Pending Match</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;