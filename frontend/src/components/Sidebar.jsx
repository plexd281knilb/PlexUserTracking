import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const links = [
        { name: 'Dashboard', path: '/' },
        { name: 'Users', path: '/users' },
        { name: 'Venmo', path: '/payments/venmo' },
        { name: 'Zelle', path: '/payments/zelle' },
        { name: 'PayPal', path: '/payments/paypal' },
        { name: 'Expenses', path: '/expenses' },
        { name: 'Settings', path: '/settings' },
        { name: 'Admin Setup', path: '/admin/setup' },
        { name: 'Admin Login', path: '/admin/login' },
    ];

    return (
        <div className="sidebar">
            {links.map((link) => (
                <Link
                    key={link.name}
                    to={link.path}
                    className={currentPath === link.path ? 'active' : ''}
                >
                    {link.name}
                </Link>
            ))}
        </div>
    );
};

export default Sidebar;
