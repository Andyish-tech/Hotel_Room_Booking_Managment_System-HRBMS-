import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

// Layouts
import MainLayout from './Layout/MainLayout';
import AuthLayout from './Layout/AuthLayout';

// Pages
import Welcome from './Pages/Welcome';
import Login from './Pages/Login';
import ForgotPassword from './Pages/ForgotPassword';
import Dashboard from './Pages/Dashboard';
import Rooms from './Pages/Rooms';
import Customers from './Pages/Customers';
import Bookings from './Pages/Bookings';
import Payments from './Pages/Payments';
import Reports from './Pages/Reports';
import Users from './Pages/Users';
import Security from './Pages/Security';

// Axios default config
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await axios.get('/auth/session');
      if (response.data.authenticated) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (        <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading Golden Stay Hotel...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
        limit={5}
        closeButton={false}
        className="toast-container"
        toastClassName="custom-toast-wrapper"
        bodyClassName="custom-toast-body"
      />
      <Routes>
        {/* Welcome Landing Page */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Welcome />
            )
          }
        />

        {/* Login Route */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthLayout>
                <Login onLogin={handleLogin} />
              </AuthLayout>
            )
          }
        />

        {/* Forgot Password Route */}
        <Route
          path="/forgot-password"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthLayout>
                <ForgotPassword />
              </AuthLayout>
            )
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            user ? (
              <MainLayout user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={
            user?.Role === 'staff' ? <Navigate to="/dashboard" replace /> : <Users user={user} />
          } />
          <Route path="/security" element={<Security />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
