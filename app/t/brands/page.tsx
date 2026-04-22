"use client";

import { BrandsListTable } from "@/components/brands";
import { Button } from "@/components/ui/button";
import { useBrandsListQuery } from "@/lib/tan-stack/brands";
import { useRouter } from "next/navigation";
import React from "react";

export default function BrandsPage() {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "active" | "inactive">(
    "all",
  );

  const { data = [], isLoading } = useBrandsListQuery({
    q: q.trim() ? q.trim() : undefined,
    isActive: status === "all" ? undefined : status === "active",
  });
  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold">Brands</div>
          <div className="text-sm text-muted-foreground">
            Brands help organize locations, menus, and customer-facing identity.
          </div>
        </div>
        {/* {data?.length < 1 && ( */}
          <Button onClick={() => router.push("/t/brands/new")}>
            New brand
          </Button>
        {/* // )} */}
      </div>

      <BrandsListTable
        data={data}
        isLoading={isLoading}
        q={q}
        setQ={setQ}
        status={status}
        setStatus={setStatus}
      />
    </div>
  );
}
