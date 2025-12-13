// Add state for logs
const [logs, setLogs] = useState([]);

// Add to fetch function
const fetchLogs = async () => {
    const data = await apiGet('/payment_logs'); // We need to create this route
    setLogs(data.filter(l => l.service === 'Venmo'));
};

useEffect(() => { fetch(); fetchLogs(); }, []);

// ... Inside return() ...

<div className="card" style={{marginTop: '25px'}}>
    <h3>Payment History (Venmo)</h3>
    <table className="table">
        <thead><tr><th>Date</th><th>Sender</th><th>Amount</th><th>Status</th><th>Matched User</th></tr></thead>
        <tbody>
            {logs.map((log, i) => (
                <tr key={i}>
                    <td>{log.date}</td>
                    <td>{log.sender}</td>
                    <td>{log.amount}</td>
                    <td>
                        <span style={{
                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem',
                            backgroundColor: log.status === 'Matched' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: log.status === 'Matched' ? '#10b981' : '#ef4444'
                        }}>
                            {log.status}
                        </span>
                    </td>
                    <td>{log.mapped_user || '-'}</td>
                </tr>
            ))}
        </tbody>
    </table>
</div>