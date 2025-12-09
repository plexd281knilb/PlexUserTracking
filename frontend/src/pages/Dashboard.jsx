import React, { useEffect, useState } from 'react';
import api from '../api';

const Dashboard = () => {
  const [summary, setSummary] = useState({});

  useEffect(() => {
    api.get('/dashboard/summary').then(res => setSummary(res.data));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(summary, null, 2)}</pre>
    </div>
  );
};

export default Dashboard;
