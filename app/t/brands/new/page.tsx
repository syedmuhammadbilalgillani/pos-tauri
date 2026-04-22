"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BrandForm } from "@/components/brands";
import { CreateBrandInput, useCreateBrandMutation } from "@/lib/tan-stack/brands";

export default function NewBrandPage() {
  const router = useRouter();
  const m = useCreateBrandMutation();

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">New brand</div>
          <div className="text-sm text-muted-foreground">
            Create a brand for your tenant. You can edit details later.
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push("/t/brands")}>
          Back to list
        </Button>
      </div>

      <BrandForm
        mode="create"
        isSubmitting={m.isPending}
        errorText={m.error ? (m.error as Error).message : null}
        onCancel={() => router.push("/t/brands")}
        onSubmit={async (input) => {
          const created = await m.mutateAsync(input as CreateBrandInput);
          router.push(`/t/brands/id?id=${created.id}`);
        }}
      />
    </div>
  );
}
