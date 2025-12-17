import React, { useState, useEffect } from 'react';
import { apiGet } from 'api';

const Upcoming = () => {
    // Default: Today to Today + 30 Days
    const defaultStart = new Date().toISOString().split('T')[0];
    const defaultEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [range, setRange] = useState({ start: defaultStart, end: defaultEnd });
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchUpcoming = async () => {
        setLoading(true);
        try {
            const data = await apiGet(`/upcoming?start=${range.start}&end=${range.end}`);
            setEvents(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUpcoming();
    }, [range]); // Re-fetch when dates change

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1>Upcoming Automations</h1>
            
            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>Filter Date Range</h3>
                <div className="flex" style={{ gap: '20px', alignItems: 'flex-end' }}>
                    <div>
                        <label className="small">Start Date</label>
                        <input 
                            type="date" 
                            className="input" 
                            value={range.start} 
                            onChange={e => setRange({ ...range, start: e.target.value })} 
                        />
                    </div>
                    <div>
                        <label className="small">End Date</label>
                        <input 
                            type="date" 
                            className="input" 
                            value={range.end} 
                            onChange={e => setRange({ ...range, end: e.target.value })} 
                        />
                    </div>
                    <button className="button" onClick={fetchUpcoming}>Refresh List</button>
                </div>
            </div>

            <div className="card">
                <h3>Projected Actions</h3>
                <p className="small" style={{ marginBottom: '15px' }}>
                    Showing automated actions scheduled between <strong>{range.start}</strong> and <strong>{range.end}</strong>.
                </p>
                
                {loading ? <p>Loading...</p> : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Full Name</th>
                                <th>Frequency</th>
                                <th>Next Notification</th>
                                <th>Disabled On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.length > 0 ? events.map((row, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 'bold' }}>{row.username}</td>
                                    <td>{row.full_name}</td>
                                    <td>
                                        <span style={{
                                            fontSize: '0.75rem', 
                                            padding: '2px 6px', 
                                            borderRadius: '4px', 
                                            backgroundColor: row.freq === 'Yearly' ? '#8b5cf6' : '#64748b', 
                                            color: 'white'
                                        }}>
                                            {row.freq}
                                        </span>
                                    </td>
                                    <td style={{ color: '#f59e0b' }}>{row.notif_date}</td>
                                    <td style={{ color: '#ef4444', fontWeight: 'bold' }}>{row.disabled_date}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        No upcoming automations found in this date range.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Upcoming;