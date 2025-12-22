import React, { useState, useEffect } from 'react';
import { apiGet } from 'api';

const Dashboard = () => {
    const [data, setData] = useState({
        total_users: 0, active_users: 0, est_monthly_income: 0,
        ytd_expenses: 0, net_run_rate: 0, recent_activity: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const res = await apiGet('/dashboard');
                setData(res);
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        loadDashboard();
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <h1>Dashboard Overview</h1>
            
            <div className="grid-cards">
                <div className="card" style={{borderTop: '4px solid var(--accent)'}}>
                    <h4>Total Users</h4>
                    <div style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{data.total_users}</div>
                    <div style={{fontSize: '0.9rem', color: 'var(--success)'}}>{data.active_users} Active</div>
                </div>

                <div className="card" style={{borderTop: '4px solid var(--success)'}}>
                    <h4>Est. Monthly Income</h4>
                    <div style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{formatCurrency(data.est_monthly_income)}</div>
                    <div style={{fontSize: '0.9rem', color: 'var(--success)'}}>Based on active users</div>
                </div>

                <div className="card" style={{borderTop: '4px solid var(--danger)'}}>
                    <h4>YTD Expenses</h4>
                    <div style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{formatCurrency(data.ytd_expenses)}</div>
                    <div style={{fontSize: '0.9rem', color: 'var(--danger)'}}>Total costs</div>
                </div>

                <div className="card" style={{borderTop: '4px solid var(--accent)'}}>
                    <h4>Net Run Rate</h4>
                    <div style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{formatCurrency(data.net_run_rate)}</div>
                    <div style={{fontSize: '0.9rem', color: 'var(--accent)'}}>Projected Annual Profit</div>
                </div>
            </div>

            <div className="card">
                <h3>Recent Activity</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr><th>Date</th><th>Description</th><th>Amount</th><th>Service</th></tr>
                        </thead>
                        <tbody>
                            {data.recent_activity.length > 0 ? (
                                data.recent_activity.map((log, i) => (
                                    <tr key={i}>
                                        <td>{log.date}</td>
                                        <td>{log.sender}</td>
                                        <td>{log.amount}</td>
                                        <td><span className="button btn-sm btn-secondary" style={{cursor:'default'}}>{log.service}</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" style={{textAlign:'center', color:'var(--text-muted)'}}>No recent activity recorded.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;