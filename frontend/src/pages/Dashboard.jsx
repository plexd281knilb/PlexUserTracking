import React from 'react';
// Assuming Dashboard component calls backend API to fetch summary data

const Dashboard = () => {
    // Placeholder Data
    const summary = {
        totalUsers: 42,
        totalPayments: 1500.00,
        totalExpenses: 200.00,
        incomeYoY: '+15%',
    };

    const Card = ({ title, value, detail }) => (
        <div className="content-card" style={{ flex: 1, textAlign: 'center', margin: '0 10px' }}>
            <p className="text-muted-color" style={{ margin: '0 0 5px 0' }}>{title}</p>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>{value}</h3>
            <p style={{ margin: 0, fontSize: '0.8em', color: detail.startsWith('+') ? 'green' : 'red' }}>{detail}</p>
        </div>
    );

    return (
        <div>
            <h1>Dashboard Overview</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Card title="Total Users" value={summary.totalUsers} detail="Active" />
                <Card title="Payments Collected (YTD)" value={`$${summary.totalPayments.toFixed(2)}`} detail={summary.incomeYoY} />
                <Card title="Total Expenses (YTD)" value={`$${summary.totalExpenses.toFixed(2)}`} detail="" />
            </div>

            <div className="content-card">
                <h2>Recent Activity</h2>
                <p className="text-muted-color">Placeholder for a chart or recent events list.</p>
                {/* Example Table */}
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>2025-12-10</td><td>User A</td><td>Payment Received</td><td style={{color: 'green'}}>$25.00</td></tr>
                        <tr><td>2025-12-09</td><td>User B</td><td>Fee Due</td><td style={{color: 'red'}}>$5.00</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;