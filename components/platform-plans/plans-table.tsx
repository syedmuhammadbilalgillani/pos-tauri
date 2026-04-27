"use client";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import {
  useDeletePlanMutation,
  usePlatformPlansListQuery,
  type Plan,
} from "@/lib/tan-stack/platform-plans";
import { useRouter } from "next/navigation";
import * as React from "react";

export function PlatformPlansTable() {
  const [q, setQ] = React.useState("");
  const [includeInactive, setIncludeInactive] = React.useState(false);

  const router = useRouter();
  const list = usePlatformPlansListQuery({
    q: q.trim() ? q.trim() : undefined,
    includeInactive,
  });

  const deleteM = useDeletePlanMutation();

  const items = list.data ?? [];

  const columns = React.useMemo<DataTableColumn<Plan>[]>(
    () => [
      { id: "name", header: "Name", accessor: (r) => r.name, priority: 1 },
      {
        id: "slug",
        header: "Slug",
        accessor: (r) => r.slug,
        hideBelow: "md",
        priority: 3,
      },
      {
        id: "isActive",
        header: "Status",
        type: "status",
        accessor: (r) => (r.isActive ? "active" : "inactive"),
        statusLabelMap: { active: "Active", inactive: "Inactive" },
        statusVariantMap: { active: "default", inactive: "secondary" },
        priority: 2,
      },
      {
        id: "monthlyPrice",
        header: "Monthly",
        accessor: (r) => r.monthlyPrice ?? "—",
        hideBelow: "lg",
        priority: 5,
      },
      {
        id: "trialDays",
        header: "Trial",
        accessor: (r) => `${r.trialDays}d`,
        hideBelow: "lg",
        priority: 6,
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
                  `/platform-admin/plans/mode?mode=edit&id=${row.id}`,
                );
              }}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteM.isPending}
              onClick={(e) => {
                e.stopPropagation();
                deleteM.mutate(row.id);
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteM.isPending, router],
  );

  return (
    <div className="">
      <div className="rounded-xl border bg-background p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-base font-semibold">Plans</div>
            <div className="text-sm text-muted-foreground">
              Manage SaaS plan catalog and feature limits.
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or slug..."
              className="h-9 w-full sm:w-56 rounded-md border bg-background px-3 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="h-4 w-4 rounded border border-input accent-primary"
              />
              Include inactive
            </label>
            <Button
              onClick={() => {
                router.push(`/platform-admin/plans/mode?mode=create`);
              }}
            >
              New plan
            </Button>
          </div>
        </div>

        {list.error ? (
          <div className="text-sm text-destructive">
            {(list.error as Error).message}
          </div>
        ) : null}

        <DataTable<Plan>
          data={items}
          columns={columns}
          isLoading={list.isLoading}
          getRowId={(r) => r.id}
          emptyText="No plans."
        />
      </div>
    </div>
  );
}
