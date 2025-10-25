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
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;