// src/hooks/usePermissions.js
import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string|string[]} requiredPermission - Permiso o array de permisos requeridos
   * @param {boolean} requireAll - Si es true, requiere todos los permisos (AND). False para cualquiera (OR)
   */
  const hasPermission = (requiredPermission, requireAll = false) => {
    if (!user?.permisos) return false;
    
    const userPermissions = user.permisos.map(p => p.nombrePermiso);
    
    if (Array.isArray(requiredPermission)) {
      return requireAll
        ? requiredPermission.every(perm => userPermissions.includes(perm))
        : requiredPermission.some(perm => userPermissions.includes(perm));
    }
    
    return userPermissions.includes(requiredPermission);
  };

  return { hasPermission };
};