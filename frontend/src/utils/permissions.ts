import { User } from '../types/user';

interface Permission {
  action: 'create' | 'read' | 'update' | 'delete';
  resource: 'receita' | 'despesa' | 'users' | 'reports';
}

const permissionsByRole = {
  admin: {
    receita: ['create', 'read', 'update', 'delete'],
    despesa: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    reports: ['read'],
  },
  operator: {
    receita: ['create', 'read', 'update', 'delete'],
    despesa: ['create', 'read', 'update', 'delete'],
    users: [],
    reports: ['read'],
  },
};

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  
  const rolePermissions = permissionsByRole[user.accessLevel];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[permission.resource] as string[];
  return resourcePermissions.includes(permission.action);
};

export const canManageReceita = (user: User | null): boolean => {
  return hasPermission(user, { action: 'create', resource: 'receita' });
};

export const canManageDespesa = (user: User | null): boolean => {
  return hasPermission(user, { action: 'create', resource: 'despesa' });
};
