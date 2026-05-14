'use client';

import type { ReactNode } from 'react';
import {
  useHasAllPermissions,
  useHasAnyPermission,
  usePermission,
} from '@/lib/hooks/usePermission';

interface PermissionGuardProps {
  /** Require exactly this one permission */
  permission?: string;
  /** Require at least one of these permissions */
  anyOf?: string[];
  /** Require all of these permissions */
  allOf?: string[];
  /** Rendered when permission check fails (default: null) */
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const hasSingle = usePermission(permission ?? '');
  const hasAny = useHasAnyPermission(anyOf ?? []);
  const hasAll = useHasAllPermissions(allOf ?? []);

  let allowed = true;

  if (permission !== undefined) allowed = allowed && hasSingle;
  if (anyOf !== undefined && anyOf.length > 0) allowed = allowed && hasAny;
  if (allOf !== undefined && allOf.length > 0) allowed = allowed && hasAll;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
