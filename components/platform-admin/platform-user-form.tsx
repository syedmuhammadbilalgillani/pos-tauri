"use client";

import * as React from "react";
import { DynamicForm, type DynamicField } from "@/components/forms/form-builder";
import type { PlatformUser } from "@/lib/tan-stack/platform-users";

export type PlatformUserFormValues = {
  email: string;
  fullName: string;
  role: "super_admin" | "support";
  isActive: boolean;
  password: string;
};

export function PlatformUserForm(props: {
  mode: "create" | "edit";
  initial?: PlatformUser | null;
  isSubmitting?: boolean;
  errorText?: string | null;
  onSubmit: (input: {
    email?: string;
    fullName?: string;
    role?: "super_admin" | "support";
    isActive?: boolean;
    password?: string;
  }) => Promise<void> | void;
}) {
  const { mode, initial, isSubmitting, errorText, onSubmit } = props;

  const fields = React.useMemo<DynamicField<PlatformUserFormValues>[]>(() => {
    const base: DynamicField<PlatformUserFormValues>[] = [
      {
        type: "input",
        name: "email",
        label: "Email",
        inputType: "email",
        rules: { required: "Email is required" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "fullName",
        label: "Full name",
        rules: { required: "Full name is required" },
        colSpan: 6,
      },
      {
        type: "select",
        name: "role",
        label: "Role",
        options: [
          { label: "Super admin", value: "super_admin" },
          { label: "Support", value: "support" },
        ],
        rules: { required: "Role is required" },
        colSpan: 6,
      },
      {
        type: "switch",
        name: "isActive",
        label: "Active",
        helperText: "Inactive platform users cannot access platform-admin.",
        colSpan: 6,
      },
      {
        type: "input",
        name: "password",
        label: mode === "create" ? "Password" : "New password (optional)",
        inputType: "password",
        rules: mode === "create" ? { required: "Password is required", minLength: { value: 8, message: "Min 8 characters" } } : undefined,
        colSpan: 12,
      },
    ];
    return base;
  }, [mode]);

  return (
    <div className="rounded-xl border bg-background p-4 space-y-3">
      <div>
        <div className="text-base font-semibold">
          {mode === "create" ? "Create platform user" : "Edit platform user"}
        </div>
        {errorText ? <div className="mt-1 text-sm text-destructive">{errorText}</div> : null}
      </div>

      <DynamicForm<PlatformUserFormValues>
        fields={fields}
        defaultValues={{
          email: initial?.email ?? "",
          fullName: initial?.fullName ?? "",
          role: initial?.role ?? "support",
          isActive: initial?.isActive ?? true,
          password: "",
        }}
        isSubmitting={isSubmitting}
        submitLabel={mode === "create" ? "Create" : "Save changes"}
        transformValues={(v) => ({
          ...v,
          email: v.email.trim().toLowerCase(),
          fullName: v.fullName.trim(),
        })}
        onSubmit={async (values) => {
          await onSubmit({
            email: values.email,
            fullName: values.fullName,
            role: values.role,
            isActive: values.isActive,
            password: values.password.trim() ? values.password : undefined,
          });
        }}
      />
    </div>
  );
}