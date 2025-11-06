import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/layout/Navigation';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import UserManagement from './components/users/UserManagement';
import DonorManagement from './components/donors/DonorManagement';
import Inventory from './components/inventory/Inventory';
import ABOTesting from './components/abo/ABOTesting';
import InfectiousTesting from './components/infectious/InfectiousTesting';
import Distribution from './components/distribution/Distribution';
import BloodRequests from './components/requests/BloodRequests';
import DonorProfile from './components/profile/DonorProfile';
import Reports from './components/reports/Reports';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>Access Denied</h4>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }
  
  return children;
};


const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route path="/reports" element={<Reports />} />

            <Route 
              path="/users" 
              element={
                <PrivateRoute>
                  <UserManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/donors" 
              element={
                <PrivateRoute>
                  <DonorManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/donor-profile" 
              element={
                <PrivateRoute>
                  <DonorProfile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/inventory" 
              element={
                <PrivateRoute>
                  <Inventory />
                </PrivateRoute>
              } 
            />
            <Route 
                path="/abo-testing" 
                element={
                  <PrivateRoute allowedRoles={['abo_laboratory', 'general_manager', 'data_manager']}>
                    <ABOTesting />
                  </PrivateRoute>
                } 
              />
            <Route 
                path="/infectious-testing" 
                element={
                  <PrivateRoute allowedRoles={['infectious_laboratory', 'general_manager', 'data_manager']}>
                    <InfectiousTesting />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/distribution" 
                element={
                  <PrivateRoute allowedRoles={['blood_distributer', 'general_manager', 'council']}>
                    <Distribution />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/requests" 
                element={
                  <PrivateRoute allowedRoles={['general_manager', 'council', 'blood_distributer']}>
                    <BloodRequests />
                  </PrivateRoute>
                } 
              />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;