"use client";

import { BrandForm } from "@/components/brands";
import { Button } from "@/components/ui/button";
import {
  useBrandByIdQuery,
  useUpdateBrandMutation,
} from "@/lib/tan-stack/brands";
import { useRouter, useSearchParams } from "next/navigation";

export default function EditBrandPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const q = useBrandByIdQuery(id as string);
  const m = useUpdateBrandMutation();

  if (q.isLoading) return null;
  if (!q.data) return null;

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">Edit brand</div>
          <div className="text-sm text-muted-foreground">
            Update details carefully. Changes apply immediately.
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/t/brands/id?id=${id}`)}
        >
          Back
        </Button>
      </div>

      <BrandForm
        mode="edit"
        initial={q.data}
        isSubmitting={m.isPending}
        errorText={m.error ? (m.error as Error).message : null}
        onCancel={() => router.push(`/t/brands/${id}`)}
        onSubmit={async (input) => {
          await m.mutateAsync({ id: id as string, input });
          router.push(`/t/brands/id?id=${id}`);
        }}
      />
    </div>
  );
}
