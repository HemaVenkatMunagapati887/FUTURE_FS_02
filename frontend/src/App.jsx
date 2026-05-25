import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoutes';
import Layout from './components/Layout';

// Page Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetails from './pages/LeadDetails';
import Employees from './pages/Employees';
import Settings from './pages/Settings';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<Login />} />

            {/* Secure Protected Routes (Require active authentication) */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/"
                element={
                  <Layout>
                    <Dashboard />
                  </Layout>
                }
              />
              <Route
                path="/leads"
                element={
                  <Layout>
                    <Leads />
                  </Layout>
                }
              />
              <Route
                path="/leads/:id"
                element={
                  <Layout>
                    <LeadDetails />
                  </Layout>
                }
              />
              <Route
                path="/settings"
                element={
                  <Layout>
                    <Settings />
                  </Layout>
                }
              />
              <Route
                path="/unauthorized"
                element={
                  <Layout>
                    <Unauthorized />
                  </Layout>
                }
              />
            </Route>

            {/* Secure Restricted Routes (Requires Admin or Manager credentials) */}
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
              <Route
                path="/employees"
                element={
                  <Layout>
                    <Employees />
                  </Layout>
                }
              />
            </Route>

            {/* Fallback Redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
