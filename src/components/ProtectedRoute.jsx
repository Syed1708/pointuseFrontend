import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredPermission }) {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && user.role) {
    const isAdmin = user.role.name === 'admin';
    const hasPermission = user.role.permissions?.includes(requiredPermission) || isAdmin;

    if (!hasPermission) {
      return (
        <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-500">You do not have permission to view this resource.</p>
        </div>
      );
    }
  }

  return children;
}