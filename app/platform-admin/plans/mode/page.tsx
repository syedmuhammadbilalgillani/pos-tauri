"use client";
import { PlanForm } from "@/components/platform-plans";
import {
  CreatePlanInput,
  Plan,
  UpdatePlanInput,
  useCreatePlanMutation,
  usePlatformPlanQuery,
  useUpdatePlanMutation,
} from "@/lib/tan-stack/platform-plans";
import { useSearchParams } from "next/navigation";
import React from "react";

const ModePage = () => {
  const mode = useSearchParams().get("mode");
  const id = useSearchParams().get("id");
  const plan = usePlatformPlanQuery(id ?? "");
  const createM = useCreatePlanMutation();
  const updateM = useUpdatePlanMutation();

  return (
    <div className="space-y-3">
      {mode === "create" ? (
        <PlanForm
          mode="create"
          isSubmitting={createM.isPending}
          errorText={createM.error ? (createM.error as Error).message : null}
          onSubmit={async (input) => {
            await createM.mutateAsync(input as CreatePlanInput);
          }}
        />
      ) : null}

      {mode === "edit" ? (
        <PlanForm
          mode="edit"
          initial={plan.data}
          isSubmitting={updateM.isPending}
          errorText={updateM.error ? (updateM.error as Error).message : null}
          onSubmit={async (input) => {
            if (!plan.data) return;
            await updateM.mutateAsync({
              id: plan.data.id,
              input: input as UpdatePlanInput,
            });
          }}
        />
      ) : null}

      {mode === "none" ? (
        <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
          Select a plan to edit, or create a new one.
          <div className="mt-2">
            Tip: use “Inactive” instead of delete for plans already assigned to
            tenants.
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ModePage;
