/** 
 * Every module in the system and its allowed actions.
 * Add new modules here as you build them — nowhere else.
 */
export const PERMISSION_MODULES = [
    'orders',       // view | create | edit | cancel | void
    'menu',         // view | create | edit | publish
    'staff',        // view | manage
    'reports',      // view | export
    'settings',     // view | edit
    'customers',    // view | edit
    'payments',     // view | refund
    'delivery',     // view | manage
    'inventory',    // view | edit | manage
    'kds',          // view | manage
    'loyalty',      // view | manage
    'reservations', // view | manage
  ] as const;
  
  export type PermissionModule = (typeof PERMISSION_MODULES)[number];
  
  export const PERMISSION_ACTIONS = [
    'view', 'create', 'edit', 'cancel',
    'void', 'publish', 'manage', 'export', 'refund',
  ] as const;
  
  export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
  
  export type ModulePermissions = Partial<Record<PermissionAction, boolean>>;
  export type PermissionMap     = Partial<Record<PermissionModule, ModulePermissions>>;
  
  /** What the plan allows — derived from feature flags + optional permissionCap override */
  export type PlanCap = PermissionMap;
  
  /** Shape stored in roles.permissions JSONB column */
  export type RolePermissions = PermissionMap;