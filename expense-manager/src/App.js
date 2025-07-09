import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GuestPage from './components/GuestPage';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import CompleteProfile from './components/CompleteProfile';
import Reports from './components/Reports';
import Wallet from './components/Wallet';
import PrivateRoute from './components/PrivateRoute';
import Savings from './components/Savings'; // ✅ Savings imported

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GuestPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <PrivateRoute>
              <Wallet />
            </PrivateRoute>
          }
        />
        <Route
          path="/savings"  // ✅ added Savings route
          element={
            <PrivateRoute>
              <Savings />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
