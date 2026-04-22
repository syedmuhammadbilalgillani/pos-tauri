"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrandByIdQuery, useDeactivateBrandMutation } from "@/lib/tan-stack/brands";
import { useRouter, useSearchParams } from "next/navigation";

export default function BrandDetailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const q = useBrandByIdQuery(id as string);
  const { mutate: deactivate, isPending: isDeactivating } = useDeactivateBrandMutation();

  if (q.isLoading) return null;
  if (!q.data) return null;

  const b = q.data;

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-semibold flex items-center gap-3">
            {b.name}
            <Badge variant={b.isActive ? "default" : "secondary"}>
              {b.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Slug: <span className="font-medium text-foreground">{b.slug}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/t/brands")}>
            Back
          </Button>
          <Button variant="outline" onClick={() => router.push(`/t/brands/id/edit?id=${b.id}`)}>
            Edit
          </Button>
          <Button
            variant="destructive"
            disabled={isDeactivating || !b.isActive}
            onClick={() => deactivate(b.id)}
          >
            Deactivate
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-background p-4 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-sm text-muted-foreground">Cuisine</div>
          <div className="text-sm">{b.cuisineType ?? "—"}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Primary color</div>
          <div className="text-sm">{b.primaryColor ?? "—"}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm text-muted-foreground">Description</div>
          <div className="text-sm whitespace-pre-wrap">{b.description ?? "—"}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Created</div>
          <div className="text-sm">{new Date(b.createdAt).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Updated</div>
          <div className="text-sm">{new Date(b.updatedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}