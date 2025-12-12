import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from 'api';

const PaymentsVenmo = () => {
    const service = 'venmo';
    const [accounts, setAccounts] = useState([]);
    const [newAcc, setNewAcc] = useState({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });

    const fetch = async () => { try { const r = await apiGet(`/payment_emails/${service}`); setAccounts(r); } catch (e) { setAccounts([]); } };
    useEffect(() => { fetch(); }, []);

    const add = async (e) => {
        e.preventDefault();
        await apiPost(`/payment_emails/${service}`, newAcc, localStorage.getItem('admin_token'));
        setNewAcc({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
        fetch();
    };

    return (
        <div>
            <h1>Venmo Email Scanners</h1>
            <div className="card">
                <table className="table">
                    <thead><tr><th>Email</th><th>Actions</th></tr></thead>
                    <tbody>
                        {accounts.map(acc => (
                            <tr key={acc.id}>
                                <td>{acc.email}</td>
                                <td><button className="button" style={{backgroundColor: 'red'}} onClick={async () => { await apiDelete(`/payment_emails/${service}/${acc.id}`); fetch(); }}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="card">
                <h3>Add New {service} Scanner</h3>
                <form onSubmit={add} style={{display: 'grid', gap: '10px'}}>
                    <input className="input" placeholder="Email" value={newAcc.email} onChange={e=>setNewAcc({...newAcc, email: e.target.value})} />
                    <input className="input" type="password" placeholder="App Password" value={newAcc.password} onChange={e=>setNewAcc({...newAcc, password: e.target.value})} />
                    <button className="button" type="submit">Connect Account</button>
                </form>
            </div>
        </div>
    );
};
export default PaymentsVenmo;