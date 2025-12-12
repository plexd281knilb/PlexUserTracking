import React, { useState, useEffect } from 'react';
import { apiGet } from 'api';

const Dashboard = () => {
    const [summary, setSummary] = useState({
        total_users: 0,
        active_users: 0,
        income_mo: 0,
        expense_yr: 0,
        recent_activity: []
    });

    useEffect(() => {
        const loadStats = async () => {
            try {
                // We will create this endpoint in the next step
                const data = await apiGet('/dashboard/summary');
                setSummary(data);
            } catch (e) { console.error(e); }
        };
        loadStats();
    }, []);

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
            
            <div className="flex" style={{marginBottom: '20px', alignItems: 'stretch', flexWrap: 'wrap'}}>
                <StatCard title="Total Users" value={summary.total_users} sub={`${summary.active_users} Active`} color="var(--accent)" />
                <StatCard title="Est. Monthly Income" value={`$${summary.income_mo}`} sub="Based on active users" color="#10b981" />
                <StatCard title="YTD Expenses" value={`$${summary.expense_yr}`} sub="Total costs" color="#ef4444" />
                <StatCard title="Net Run Rate" value={`$${(summary.income_mo * 12) - summary.expense_yr}`} sub="Projected Annual Profit" color="var(--accent)" />
            </div>

            <div className="card">
                <h3>Recent Activity</h3>
                <table className="table">
                    <thead>
                        <tr><th>Date</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        {summary.recent_activity.length > 0 ? (
                            summary.recent_activity.map((act, i) => (
                                <tr key={i}>
                                    <td style={{width: '150px'}}>{act.date}</td>
                                    <td>{act.desc}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="2">No recent activity recorded.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;