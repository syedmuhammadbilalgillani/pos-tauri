"use client";

import * as React from "react";
import { DynamicForm, type DynamicField } from "@/components/forms/form-builder";
import type { Brand, CreateBrandInput, UpdateBrandInput } from "@/lib/tan-stack/brands";

export type BrandFormValues = {
  name: string;
  slug: string;
  cuisineType: string;
  primaryColor: string;
  isActive: boolean;
  description: string;
};

const fields: DynamicField<BrandFormValues>[] = [
  { type: "input", name: "name", label: "Brand name", rules: { required: "Name is required" }, colSpan: 6 },
  { type: "slug", name: "slug", label: "Slug", helperText: "Used in URLs. Auto-normalized.", rules: { required: "Slug is required" }, colSpan: 6 },
  { type: "input", name: "cuisineType", label: "Cuisine", placeholder: "Burgers", colSpan: 4 },
  { type: "input", name: "primaryColor", label: "Primary color", inputType: "color", colSpan: 4 },
  { type: "switch", name: "isActive", label: "Active", helperText: "Inactive brands won’t appear to customers.", colSpan: 4 },
  { type: "textarea", name: "description", label: "Description", placeholder: "Short description for menus/SEO", colSpan: 12 },
];

export function BrandForm(props: {
  mode: "create" | "edit";
  initial?: Brand | null;
  isSubmitting?: boolean;
  errorText?: string | null;
  onSubmit: (input: CreateBrandInput | UpdateBrandInput) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const { mode, initial, isSubmitting, errorText, onSubmit, onCancel } = props;

  const defaults = React.useMemo(
    () => ({
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      cuisineType: initial?.cuisineType ?? "",
      primaryColor: initial?.primaryColor ?? "#3b82f6",
      isActive: initial?.isActive ?? true,
      description: initial?.description ?? "",
    }),
    [initial],
  );

  return (
    <div className="rounded-xl border bg-background p-4 space-y-3">
      <div>
        <div className="text-base font-semibold">
          {mode === "create" ? "Create brand" : "Edit brand"}
        </div>
        {errorText ? <div className="mt-1 text-sm text-destructive">{errorText}</div> : null}
      </div>

      <DynamicForm<BrandFormValues>
        fields={fields}
        defaultValues={defaults}
        isSubmitting={isSubmitting}
        submitLabel={mode === "create" ? "Create" : "Save changes"}
        footer={
          onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="ml-3 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          ) : null
        }
        transformValues={(v) => ({
          ...v,
          name: v.name.trim(),
          cuisineType: v.cuisineType.trim(),
          description: v.description.trim(),
        })}
        onSubmit={async (values) => {
          await onSubmit({
            name: values.name,
            slug: values.slug,
            cuisineType: values.cuisineType || null,
            primaryColor: values.primaryColor || null,
            isActive: values.isActive,
            description: values.description || null,
          });
        }}
      />
    </div>
  );
}