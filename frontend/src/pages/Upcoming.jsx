import React, { useState, useEffect } from 'react';
import { apiGet } from 'api';

const Upcoming = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await apiGet('/upcoming');
                setList(res);
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        loadData();
    }, []);

    const getStatusColor = (days) => {
        if (days < 0) return 'var(--danger)'; 
        if (days <= 3) return 'var(--warning)';
        return 'var(--success)';
    };

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <h1>Upcoming Automations</h1>
            <p className="small" style={{ marginBottom: '20px' }}>
                Showing active subscriptions expiring in the next 60 days. Emails are sent automatically on the Reminder Date.
            </p>

            <div className="card table-container">
                <table className="table">
                    <thead>
                        <tr><th>User</th><th>Frequency</th><th>Expires On</th><th>Reminder Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {list.length > 0 ? (
                            list.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{item.username}</div>
                                        <div className="small">{item.email || 'No Email'}</div>
                                    </td>
                                    <td>{item.payment_freq}</td>
                                    <td>{item.expiry_date}</td>
                                    <td>{item.reminder_date}</td>
                                    <td>
                                        <span style={{
                                            color: getStatusColor(item.days_until),
                                            fontWeight: 'bold',
                                            border: `1px solid ${getStatusColor(item.days_until)}`,
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem'
                                        }}>
                                            {item.days_until < 0 ? `${Math.abs(item.days_until)} Days Overdue` : `${item.days_until} Days Left`}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No upcoming renewals found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Upcoming;