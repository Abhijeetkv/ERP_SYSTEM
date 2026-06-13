import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { FiShieldOff } from 'react-icons/fi';

const ProtectedRoute = ({ roles, children }) => {
  const { user, token, loading, hasRole } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(roles)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-500">
          <FiShieldOff className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-xl font-bold text-slate-900">
          Access Denied
        </h2>
        <p className="mt-2 max-w-md text-center text-sm text-slate-500">
          You don't have permission to view this page. Contact your
          administrator if you believe this is a mistake.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
