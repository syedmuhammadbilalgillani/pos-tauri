import type { PermissionMap } from './types';

export function can(
  permissions: PermissionMap | null | undefined,
  module: keyof PermissionMap,
  action: string,
): boolean {
  if (!permissions) return false;
  return (permissions[module] as Record<string, boolean> | undefined)?.[action] === true;
}