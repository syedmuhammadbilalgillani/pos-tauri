"use client";

import { type Brand } from "@/lib/tan-stack/brands";
import BrandCard from "./brand-card";

export function BrandsListTable({
  data,
  q,
  setQ,
  status,
  setStatus,
}: {
  data: Brand[];
  isLoading: boolean;
  q: string;
  setQ: (q: string) => void;
  status: "all" | "active" | "inactive";
  setStatus: (status: "all" | "active" | "inactive") => void;
}) {
  // const router = useRouter();

  // const { mutate: deactivate, isPending: isDeactivating } =
  //   useDeactivateBrandMutation();
  // const { mutate: deleteBrand, isPending: isDeleting } =
  //   useDeleteBrandMutation();
  // const columns = React.useMemo<DataTableColumn<Brand>[]>(
  //   () => [
  //     { id: "name", header: "Name", accessor: (r) => r.name, priority: 1 },
  //     {
  //       id: "slug",
  //       header: "Slug",
  //       accessor: (r) => r.slug,
  //       hideBelow: "md",
  //       priority: 3,
  //     },
  //     {
  //       id: "isActive",
  //       header: "Status",
  //       type: "status",
  //       accessor: (r) => (r.isActive ? "active" : "inactive"),
  //       statusLabelMap: { active: "Active", inactive: "Inactive" },
  //       statusVariantMap: { active: "default", inactive: "secondary" },
  //       priority: 2,
  //     },
  //     {
  //       id: "createdAt",
  //       header: "Created",
  //       type: "datetime",
  //       accessor: (r) => r.createdAt,
  //       hideBelow: "lg",
  //       priority: 5,
  //     },
  //     {
  //       id: "actions",
  //       header: "",
  //       type: "actions",
  //       priority: 0,
  //       cell: ({ row }) => (
  //         <div className="flex justify-end gap-2">
  //           <Button
  //             variant="outline"
  //             size="sm"
  //             onClick={(e) => {
  //               e.stopPropagation();
  //               router.push(`/t/brands/id?id=${row.id}`);
  //             }}
  //           >
  //             View
  //           </Button>
  //           <Button
  //             variant="outline"
  //             size="sm"
  //             onClick={(e) => {
  //               e.stopPropagation();
  //               router.push(`/t/brands/id/edit?id=${row.id}`);
  //             }}
  //           >
  //             Edit
  //           </Button>
  //           <Button
  //             variant="destructive"
  //             size="sm"
  //             disabled={isDeactivating || !row.isActive}
  //             onClick={(e) => {
  //               e.stopPropagation();
  //               deactivate(row.id);
  //             }}
  //           >
  //             Deactivate
  //           </Button>
  //           <Button
  //             variant="destructive"
  //             size="sm"
  //             disabled={isDeleting}
  //             onClick={(e) => {
  //               e.stopPropagation();
  //               deleteBrand(row.id);
  //             }}
  //           >
  //             Delete
  //           </Button>
  //         </div>
  //       ),
  //     },
  //   ],
  //   [deactivate, isDeactivating, router, deleteBrand, isDeleting],
  // );

  return (
    <div className="rounded-xl border bg-background p-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-base font-semibold">All brands</div>
          <div className="text-sm text-muted-foreground">
            Use search to quickly find a brand.
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or slug..."
            className="h-9 w-full sm:w-64 rounded-md border bg-background px-3 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="h-9 w-full sm:w-40 rounded-md border bg-background px-2 text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
      {/* <DataTable<Brand>
        data={data}
        columns={columns}
        isLoading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(row) => router.push(`/t/brands/id?id=${row.id}`)}
        emptyText="No brands yet. Create your first brand."
      /> */}
    </div>
  );
}
