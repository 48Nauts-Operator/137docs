import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Props {
  roles?: string[]; // allowed roles
  children: JSX.Element;
}

const RequirePermission: React.FC<Props> = ({ roles = ['admin'], children }) => {
  const { role, isAuthenticated } = useAuth();
  if (!isAuthenticated || !roles.includes(role || '')) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default RequirePermission; 