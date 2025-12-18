import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from 'api';

const MonthlyEmails = () => {
    const [template, setTemplate] = useState({ 
        email_monthly_subject: "Plex Subscription Reminder", 
        email_monthly_body: "Hi {full_name},\n\nYour monthly Plex subscription is due on {due_date}. Please submit payment to keep your access active.\n\nThanks!"
    });

    useEffect(() => {
        apiGet('/settings').then(data => {
            if(data.email_monthly_subject) setTemplate(prev => ({...prev, ...data}));
        });
    }, []);

    const handleSave = async () => {
        try {
            await apiPost('/settings', template, localStorage.getItem('admin_token'));
            alert('Template Saved!');
        } catch (e) { alert('Error saving'); }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1>Monthly Reminder Email</h1>
            <div className="card">
                <p className="small" style={{color:'var(--text-muted)', marginBottom:'20px'}}>
                    Variables available: <code>{'{full_name}'}</code>, <code>{'{username}'}</code>, <code>{'{due_date}'}</code>
                </p>
                <div style={{marginBottom:'15px'}}>
                    <label className="small">Subject Line</label>
                    <input className="input" value={template.email_monthly_subject} onChange={e => setTemplate({...template, email_monthly_subject: e.target.value})} />
                </div>
                <div style={{marginBottom:'15px'}}>
                    <label className="small">Email Body</label>
                    <textarea className="input" style={{height:'200px', fontFamily:'monospace'}} 
                        value={template.email_monthly_body} 
                        onChange={e => setTemplate({...template, email_monthly_body: e.target.value})} 
                    />
                </div>
                <button className="button" onClick={handleSave}>Save Template</button>
            </div>
        </div>
    );
};
export default MonthlyEmails;