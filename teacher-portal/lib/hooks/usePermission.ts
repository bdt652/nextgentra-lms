import { useHasPermission, usePermissions } from '@/lib/store/authStore';

export function usePermission(permission: string): boolean {
  return useHasPermission(permission);
}

export function useHasAnyPermission(permissions: string[]): boolean {
  const userPermissions = usePermissions();
  return permissions.some((p) => userPermissions.includes(p));
}

export function useHasAllPermissions(permissions: string[]): boolean {
  const userPermissions = usePermissions();
  return permissions.every((p) => userPermissions.includes(p));
}

export function useIsAdmin(): boolean {
  return useHasPermission('admin:access');
}

export function useCanCreateCourse(): boolean {
  return useHasPermission('course:create');
}

export function useCanGradeAssignment(): boolean {
  return useHasPermission('assignment:grade');
}
