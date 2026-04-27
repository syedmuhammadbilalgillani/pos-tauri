"use client";

import { PlatformAdminShell } from "@/components/platform-admin/platform-admin-shell";
import { PlatformUsersTable } from "@/components/platform-admin/platform-users-table";

export default function PlatformUsersPage() {
  return (
    <PlatformAdminShell
      title="Platform users"
      description="Manage internal staff accounts for SaaS operations."
    >
      <PlatformUsersTable />
    </PlatformAdminShell>
  );
}
