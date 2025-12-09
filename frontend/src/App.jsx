import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Venmo from './pages/Venmo';
import Zelle from './pages/Zelle';
import PayPal from './pages/PayPal';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import AdminSetup from './pages/AdminSetup';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route exact path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/payments/venmo" element={<Venmo />} />
            <Route path="/payments/zelle" element={<Zelle />} />
            <Route path="/payments/paypal" element={<PayPal />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin/setup" element={<AdminSetup />} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
