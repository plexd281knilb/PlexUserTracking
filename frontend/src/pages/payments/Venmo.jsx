import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from 'api'; // Clean Absolute Import

const PaymentsVenmo = () => {
    const service = 'venmo';
    const [accounts, setAccounts] = useState([]);
    const [newAccount, setNewAccount] = useState({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });

    const fetchAccounts = async () => {
        try {
            const response = await apiGet(`/payment_emails/${service}`); 
            setAccounts(response);
        } catch (e) { setAccounts([]); }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        await apiPost(`/payment_emails/${service}`, newAccount, localStorage.getItem('admin_token'));
        setNewAccount({ email: '', password: '', imap_server: 'imap.gmail.com', port: 993 });
        fetchAccounts();
    };

    useEffect(() => { fetchAccounts(); }, []);

    return (
        <div>
            <h1>Venmo Scanners</h1>
            <div className="card">
                <table className="table">
                    <thead>
                        <tr><th>Email</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {accounts.map(acc => (
                            <tr key={acc.id}>
                                <td>{acc.email}</td>
                                <td>{acc.enabled ? 'Enabled' : 'Disabled'}</td>
                                <td><button className="button" style={{backgroundColor:'red'}} onClick={() => apiDelete(`/payment_emails/${service}/${acc.id}`)}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="card">
                <h3>Add New Scanner</h3>
                <form onSubmit={handleAdd} className="flex" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                    <input className="input" placeholder="Email" value={newAccount.email} onChange={e=>setNewAccount({...newAccount, email: e.target.value})} />
                    <input className="input" type="password" placeholder="App Password" value={newAccount.password} onChange={e=>setNewAccount({...newAccount, password: e.target.value})} />
                    <button className="button" type="submit">Save Scanner</button>
                </form>
            </div>
        </div>
    );
};

export default PaymentsVenmo;