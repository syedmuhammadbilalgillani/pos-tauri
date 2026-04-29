import { useAuthSession } from "@/lib/tan-stack/auth/query";
import { can as canCheck } from "./can";
import type { PermissionMap } from "./types";

function normalizePermissions(raw: unknown): PermissionMap {
  if (!raw || typeof raw !== "object") return {};

  // If it's already a flat PermissionMap (has module keys like "pos"), return as-is
  const obj = raw as Record<string, unknown>;
  if ("pos" in obj || "orders" in obj || "menu" in obj) return obj as PermissionMap;

  // If backend sent role-wrapped perms like { Owner: { pos: {manage:true} } }
  // merge all top-level values (works for 1 or many roles)
  const merged: PermissionMap = {};
  for (const v of Object.values(obj)) {
    if (!v || typeof v !== "object") continue;
    const pm = v as PermissionMap;
    for (const [moduleKey, actions] of Object.entries(pm)) {
      if (!actions || typeof actions !== "object") continue;
      merged[moduleKey as keyof PermissionMap] = {
        ...(merged[moduleKey as keyof PermissionMap] ?? {}),
        ...(actions as Record<string, boolean>),
      };
    }
  }
  return merged;
}

export function usePermissions() {
  const { data: session } = useAuthSession();
  const permissions: PermissionMap = normalizePermissions(session?.user?.permissions);

  return {
    permissions,
    can: (module: keyof PermissionMap, action: string) =>
      canCheck(permissions, module, action),
  };
}