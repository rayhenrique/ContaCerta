import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermission: {
    action: 'create' | 'read' | 'update' | 'delete';
    resource: 'receita' | 'despesa' | 'users' | 'reports';
  };
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({ children, requiredPermission }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user || !hasPermission(user, requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
