import React, { useState, useEffect } from 'react';
import { apiGet } from '../../api';

const PaymentReceipts = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await apiGet('/payment_logs');
                setLogs(res.filter(l => l.status === 'Matched'));
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        loadData();
    }, []);

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <h1>Payment Receipts</h1>
            <p className="small" style={{ marginBottom: '20px' }}>
                History of payments that have been successfully linked to users. A receipt is emailed upon linking.
            </p>

            <div className="card table-container">
                <table className="table">
                    <thead>
                        <tr><th>Date</th><th>Sender</th><th>User</th><th>Amount</th><th>Service</th></tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? (
                            logs.map((log, i) => (
                                <tr key={i}>
                                    <td>{log.date}</td>
                                    <td>{log.sender}</td>
                                    <td><strong>{log.mapped_user}</strong></td>
                                    <td>{log.amount}</td>
                                    <td>
                                        <span style={{
                                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                            backgroundColor: 'var(--info)', color: 'white'
                                        }}>
                                            {log.service}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No receipts found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentReceipts;