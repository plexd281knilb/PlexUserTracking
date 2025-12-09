import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import PaymentsVenmo from './pages/PaymentsVenmo';
import PaymentsZelle from './pages/PaymentsZelle';
import PaymentsPaypal from './pages/PaymentsPaypal';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import AdminSetup from './pages/AdminSetup';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/users' element={<Users />} />
        <Route path='/payments/venmo' element={<PaymentsVenmo />} />
        <Route path='/payments/zelle' element={<PaymentsZelle />} />
        <Route path='/payments/paypal' element={<PaymentsPaypal />} />
        <Route path='/expenses' element={<Expenses />} />
        <Route path='/settings' element={<Settings />} />
        <Route path='/admin/setup' element={<AdminSetup />} />
        <Route path='/admin/login' element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}

export default App;
