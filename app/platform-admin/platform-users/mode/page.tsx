"use client";
import { PlatformUserForm } from "@/components/platform-admin/platform-user-form";

import {
  useCreatePlatformUserMutation,
  usePlatformUserQuery,
  useUpdatePlatformUserMutation,
} from "@/lib/tan-stack/platform-users";
import { useSearchParams } from "next/navigation";
import React from "react";

const ModePage = () => {
  const mode = useSearchParams().get("mode");
  const id = useSearchParams().get("id");
  const user = usePlatformUserQuery(id ?? "");
  const createM = useCreatePlatformUserMutation();
  const updateM = useUpdatePlatformUserMutation();
  return (
    <div className="space-y-3">
      {mode === "create" ? (
        <PlatformUserForm
          mode="create"
          isSubmitting={createM.isPending}
          errorText={createM.error ? (createM.error as Error).message : null}
          onSubmit={async (input) => {
            await createM.mutateAsync({
              email: input.email ?? "",
              fullName: input.fullName ?? "",
              password: input.password ?? "",
              role: input.role,
              isActive: input.isActive,
            });
          }}
        />
      ) : null}

      {mode === "edit" ? (
        <PlatformUserForm
          mode="edit"
          initial={user.data}
          isSubmitting={updateM.isPending}
          errorText={updateM.error ? (updateM.error as Error).message : null}
          onSubmit={async (input) => {
            if (!user.data) return;
            await updateM.mutateAsync({ id: user.data.id, input });
          }}
        />
      ) : null}

      {mode === "none" ? (
        <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
          Select a user to edit, or create a new one.
        </div>
      ) : null}
    </div>
  );
};

export default ModePage;
