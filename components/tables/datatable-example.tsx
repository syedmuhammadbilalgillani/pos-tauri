"use client"

import * as React from "react"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"

type DemoUserRow = {
  id: string
  name: string
  email: string
  status: "active" | "pending" | "blocked"
  verified: boolean
  createdAt: string
  balance: number
  tags: string[]
  progress: number
  website: string
}

type ServerUser = {
  id: string
  email: string
  role?: string
  status?: string
  emailVerifiedAt?: string | null
  createdAt?: string
  profile?: { fullName?: string | null } | null
}

export default function DataTableExample() {
  const [payloadPreview, setPayloadPreview] = React.useState<string>("")
  const [selectedUserKeys, setSelectedUserKeys] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const [tableData, setTableData] = React.useState<DemoUserRow[]>([])

  React.useEffect(() => {
    let cancelled = false
    async function run() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const res = await fetch("/api/server/users?limit=25", { cache: "no-store" })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string }
          throw new Error(body?.message ?? "Failed to load users")
        }
        const payload = (await res.json()) as { data?: ServerUser[] }
        const rows: DemoUserRow[] = (payload.data ?? []).map((u) => {
          const statusRaw = (u.status ?? "").toLowerCase()
          const status: DemoUserRow["status"] =
            statusRaw === "active" ? "active" : statusRaw === "pending" ? "pending" : "blocked"
          return {
            id: u.id,
            name: u.profile?.fullName ?? u.email,
            email: u.email,
            status,
            verified: Boolean(u.emailVerifiedAt),
            createdAt: u.createdAt ?? new Date().toISOString(),
            balance: 0,
            tags: [u.role ?? "user"],
            progress: 0,
            website: "",
          }
        })
        if (!cancelled) setTableData(rows)
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load users")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const tableColumns: DataTableColumn<DemoUserRow>[] = React.useMemo(
    () => [
      { id: "name", header: "Name", type: "text", accessor: (r) => r.name, priority: 1 },
      {
        id: "email",
        header: "Email",
        type: "text",
        accessor: (r) => r.email,
        priority: 2,
        hideBelow: "md",
      },
      {
        id: "status",
        header: "Status",
        type: "status",
        accessor: (r) => r.status,
        priority: 3,
        statusVariantMap: {
          active: "default",
          pending: "secondary",
          blocked: "destructive",
        },
      },
      {
        id: "verified",
        header: "Verified",
        type: "boolean",
        accessor: (r) => r.verified,
        trueLabel: "Verified",
        falseLabel: "Not verified",
        hideBelow: "md",
        priority: 7,
      },
      {
        id: "createdAt",
        header: "Created",
        type: "datetime",
        accessor: (r) => r.createdAt,
        hideBelow: "md",
        priority: 8,
      },
      {
        id: "balance",
        header: "Balance",
        type: "currency",
        accessor: (r) => r.balance,
        align: "right",
        hideBelow: "lg",
        priority: 9,
        format: { currency: "USD" },
      },
      {
        id: "tags",
        header: "Tags",
        type: "tags",
        accessor: (r) => r.tags,
        hideBelow: "lg",
        priority: 10,
        maxTags: 2,
      },
      {
        id: "progress",
        header: "Onboarding",
        type: "progress",
        accessor: (r) => r.progress,
        hideBelow: "lg",
        priority: 11,
      },
      {
        id: "website",
        header: "Website",
        type: "link",
        accessor: (r) => r.website,
        href: (r) => r.website,
        hideBelow: "xl",
        priority: 12,
      },
      {
        id: "actions",
        header: "Actions",
        type: "actions",
        align: "right",
        priority: 4,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => alert(`View ${row.id}`)}>
              View
            </Button>
            <Button size="sm" variant="outline" onClick={() => alert(`Edit ${row.id}`)}>
              Edit
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <section className="rounded-xl border bg-background p-4 md:p-6">
      <div className="mb-6 space-y-1">
        <h2 className="text-lg font-semibold">DataTable</h2>
        <p className="text-sm text-muted-foreground">
          Reusable table example with typed columns, responsive mapping, and optional row selection.
        </p>
      </div>
      <DataTable<DemoUserRow>
        data={tableData}
        columns={tableColumns}
        getRowId={(row) => row.id}
        caption="Demo users table"
        isLoading={isLoading}
        enableRowSelection
        selectedRowKeys={selectedUserKeys}
        onSelectedRowKeysChange={setSelectedUserKeys}
        onSelectedRowsChange={(rows) => {
          setPayloadPreview(
            JSON.stringify(
              {
                selectedKeys: rows.map((row) => row.id),
                selectedRows: rows,
              },
              null,
              2
            )
          )
        }}
        onRowClick={(row) => setPayloadPreview(JSON.stringify(row, null, 2))}
      />
      {loadError ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">
        Selected keys: {selectedUserKeys.length ? selectedUserKeys.join(", ") : "None"}
      </p>
      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-medium">Table Payload Preview</h3>
        <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs">{payloadPreview}</pre>
      </div>
    </section>
  )
}
