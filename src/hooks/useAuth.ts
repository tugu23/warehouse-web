import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, logout } = useAuthStore();

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = () => hasRole(['Admin']);
  const isManager = () => hasRole(['Manager']);
  const isSalesAgent = () => hasRole(['SalesAgent']);
  const canManage = () => hasRole(['Admin', 'Manager']);

  return {
    user,
    isAuthenticated,
    logout,
    hasRole,
    isAdmin,
    isManager,
    isSalesAgent,
    canManage,
  };
};
