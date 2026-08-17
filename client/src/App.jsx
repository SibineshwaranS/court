import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Hearings from './pages/Hearings';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Unauthorized from './pages/Unauthorized';

// Route Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-court-950">
        <div className="w-10 h-10 border-4 border-court-200 border-t-court-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Portal Layout */}
          <Route path="/" element={<MainLayout />}>
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Shared pages */}
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute allowedRoles={['Administrator', 'Judge', 'Court Clerk']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="cases" 
              element={
                <ProtectedRoute allowedRoles={['Administrator', 'Judge', 'Court Clerk']}>
                  <Cases />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="cases/:id" 
              element={
                <ProtectedRoute allowedRoles={['Administrator', 'Judge', 'Court Clerk']}>
                  <CaseDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="hearings" 
              element={
                <ProtectedRoute allowedRoles={['Administrator', 'Judge', 'Court Clerk']}>
                  <Hearings />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin and Judge exclusive analytics pages */}
            <Route 
              path="analytics" 
              element={
                <ProtectedRoute allowedRoles={['Administrator', 'Judge']}>
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="reports" 
              element={
                <ProtectedRoute allowedRoles={['Administrator', 'Judge']}>
                  <Reports />
                </ProtectedRoute>
              } 
            />

            {/* Authorization Failure page */}
            <Route path="unauthorized" element={<Unauthorized />} />
          </Route>

          {/* Fallback catches redirects */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
