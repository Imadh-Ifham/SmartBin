import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Simple route guard that checks localStorage for role and token.
 * - If token is missing, redirects to /login
 * - If role is not admin/authority, shows a 403-like redirect to /login
 */
const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  try {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) return <Navigate to="/login" replace />;
    if (!role || (role !== 'admin' && role !== 'authority')) return <Navigate to="/login" replace />;
    return children;
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
};

export default RequireAdmin;
