import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Authenticating user session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some(role => {
      if (role === user.role) return true;
      if (['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(role) && ['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(user.role)) return true;
      if (['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(role) && ['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(user.role)) return true;
      return false;
    });

    if (!isAllowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};
