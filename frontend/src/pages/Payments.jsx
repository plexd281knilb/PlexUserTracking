import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Venmo from './payments/Venmo';
import Zelle from './payments/Zelle';
import Paypal from './payments/Paypal';

// Base component for the /payments route
const Payments = () => {
    const location = useLocation();

    // Determine the current active tab path
    const getActivePath = () => {
        if (location.pathname.endsWith('/payments')) return 'venmo';
        if (location.pathname.includes('/venmo')) return 'venmo';
        if (location.pathname.includes('/zelle')) return 'zelle';
        if (location.pathname.includes('/paypal')) return 'paypal';
        return 'venmo'; // Default to Venmo if no path is specified
    };
    
    const activePath = getActivePath();

    return (
        <div className="payments-page">
            <h2>Payment Email Scanners</h2>
            
            <div className="tab-navigation content-card" style={{ padding: '0 1.5rem 0 1.5rem', marginBottom: '1.5rem' }}>
                <Link 
                    to="venmo" 
                    className={activePath === 'venmo' ? 'tab-link active' : 'tab-link'}
                >
                    Venmo
                </Link>
                <Link 
                    to="zelle" 
                    className={activePath === 'zelle' ? 'tab-link active' : 'tab-link'}
                >
                    Zelle
                </Link>
                <Link 
                    to="paypal" 
                    className={activePath === 'paypal' ? 'tab-link active' : 'tab-link'}
                >
                    PayPal
                </Link>
            </div>

            <div className="payment-content">
                <Routes>
                    {/* The index route defaults to Venmo, ensuring content loads initially */}
                    <Route index element={<Venmo />} /> 
                    <Route path="venmo" element={<Venmo />} />
                    <Route path="zelle" element={<Zelle />} />
                    <Route path="paypal" element={<Paypal />} />
                </Routes>
            </div>
        </div>
    );
};

export default Payments;