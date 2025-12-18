import React, { useState, useEffect } from 'react';
import { apiGet } from 'api';

const Dashboard = () => {
    const [data, setData] = useState({
        total_users: 0,
        active_users: 0,
        est_monthly_income: 0,
        ytd_expenses: 0,
        net_run_rate: 0,
        recent_activity: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const res = await apiGet('/dashboard');
                setData(res);
            } catch (e) {
                console.error("Dashboard load failed", e);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    if (loading) return <div style={{padding:'20px'}}>Loading Dashboard...</div>;

    return (
        <div>
            <h1>Dashboard Overview</h1>
            
            {/* STAT CARDS */}
            <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px'}}>
                {/* Users */}
                <div className="card" style={{flex: 1, minWidth: '200px', textAlign: 'center', borderTop: '4px solid #3b82f6'}}>
                    <h4 style={{margin: '0 0 10px 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase'}}>Total Users</h4>
                    <div style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{data.total_users}</div>
                    <div style={{fontSize: '0.8rem', color: '#10b981'}}>{data.active_users} Active</div>
                </div>

                {/* Income */}
                <div className="card" style={{flex: 1, minWidth: '200px', textAlign: 'center', borderTop: '4px solid #10b981'}}>
                    <h4 style={{margin: '0 0 10px 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase'}}>Est. Monthly Income</h4>
                    <div style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{formatCurrency(data.est_monthly_income)}</div>
                    <div style={{fontSize: '0.8rem', color: '#10b981'}}>Based on active users</div>
                </div>

                {/* Expenses */}
                <div className="card" style={{flex: 1, minWidth: '200px', textAlign: 'center', borderTop: '4px solid #ef4444'}}>
                    <h4 style={{margin: '0 0 10px 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase'}}>YTD Expenses</h4>
                    <div style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{formatCurrency(data.ytd_expenses)}</div>
                    <div style={{fontSize: '0.8rem', color: '#ef4444'}}>Total costs</div>
                </div>

                {/* Run Rate */}
                <div className="card" style={{flex: 1, minWidth: '200px', textAlign: 'center', borderTop: '4px solid #3b82f6'}}>
                    <h4 style={{margin: '0 0 10px 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase'}}>Net Run Rate</h4>
                    <div style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{formatCurrency(data.net_run_rate)}</div>
                    <div style={{fontSize: '0.8rem', color: '#3b82f6'}}>Projected Annual Profit</div>
                </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="card">
                <h3>Recent Activity</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Service</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.recent_activity.length > 0 ? (
                            data.recent_activity.map((log, i) => (
                                <tr key={i}>
                                    <td>{log.date}</td>
                                    <td>{log.sender}</td>
                                    <td>{log.amount}</td>
                                    <td>
                                        <span style={{
                                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                            backgroundColor: log.service === 'Venmo' ? '#008CFF' : log.service === 'PayPal' ? '#003087' : '#6d28d9',
                                            color: 'white'
                                        }}>
                                            {log.service}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" style={{textAlign:'center', color:'#94a3b8'}}>No recent activity recorded.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;