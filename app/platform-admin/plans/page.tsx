"use client";

import { PlatformAdminShell } from "@/components/platform-admin/platform-admin-shell";
import { PlatformPlansTable } from "@/components/platform-plans/plans-table";

export default function PlatformPlansPage() {
  return (
    <PlatformAdminShell
      title="Plans"
      description="Create and manage SaaS plans, limits, and feature gates."
    >
      <PlatformPlansTable />
    </PlatformAdminShell>
  );
}
