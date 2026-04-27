"use client";
import { useAuthSession } from '@/lib/tan-stack/auth/query';
import { can } from './can';
import type { PermissionMap } from './types';

export function usePermissions() {
  const { data: session } = useAuthSession();
  const permissions: PermissionMap = session?.user?.permissions ?? {};

  return {
    permissions,
    can: (module: keyof PermissionMap, action: string) =>
      can(permissions, module, action),
  };
}