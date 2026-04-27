"use client";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import {
  useDeactivatePlatformUserMutation,
  usePlatformUsersListQuery,
  type PlatformUser
} from "@/lib/tan-stack/platform-users";
import { useRouter } from "next/navigation";
import * as React from "react";

export function PlatformUsersTable() {
  const [q, setQ] = React.useState("");
  const router = useRouter();

  const list = usePlatformUsersListQuery({
    q: q.trim() ? q.trim() : undefined,
  });

  const deactivateM = useDeactivatePlatformUserMutation();

  const items = list.data ?? [];

  const columns = React.useMemo<DataTableColumn<PlatformUser>[]>(
    () => [
      { id: "email", header: "Email", accessor: (r) => r.email, priority: 1 },
      {
        id: "fullName",
        header: "Name",
        accessor: (r) => r.fullName,
        hideBelow: "md",
        priority: 3,
      },
      {
        id: "role",
        header: "Role",
        type: "badge",
        accessor: (r) => r.role,
        priority: 2,
      },
      {
        id: "isActive",
        header: "Status",
        type: "status",
        accessor: (r) => (r.isActive ? "active" : "inactive"),
        statusLabelMap: { active: "Active", inactive: "Inactive" },
        statusVariantMap: { active: "default", inactive: "secondary" },
        priority: 4,
      },
      {
        id: "actions",
        header: "",
        type: "actions",
        priority: 0,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  `/platform-admin/platform-users/mode?mode=edit&id=${row.id}`,
                );
              }}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deactivateM.isPending || !row.isActive}
              onClick={(e) => {
                e.stopPropagation();
                deactivateM.mutate(row.id);
              }}
            >
              Deactivate
            </Button>
          </div>
        ),
      },
    ],
    [deactivateM.isPending, router],
  );

  return (
    <div className="">
      <div className="rounded-xl border bg-background p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-base font-semibold">All platform users</div>
            <div className="text-sm text-muted-foreground">
              These accounts manage the SaaS across all tenants.
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search email or name..."
              className="h-9 w-full sm:w-56 rounded-md border bg-background px-3 text-sm"
            />
            <Button
              onClick={() => {
                router.push(`/platform-admin/platform-users/mode?mode=create`);
              }}
            >
              New user
            </Button>
          </div>
        </div>

        <DataTable<PlatformUser>
          data={items}
          columns={columns}
          isLoading={list.isLoading}
          getRowId={(r) => r.id}
          emptyText="No platform users."
        />
      </div>
    </div>
  );
}
