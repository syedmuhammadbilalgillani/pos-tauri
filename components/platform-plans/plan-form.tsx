"use client";

import * as React from "react";
import {
  DynamicForm,
  type DynamicField,
} from "@/components/forms/form-builder";
import type {
  Plan,
  CreatePlanInput,
  UpdatePlanInput,
} from "@/lib/tan-stack/platform-plans";

type PlanFormValues = {
  name: string;
  slug: string;
  description: string;

  monthlyPrice: string;
  annualPrice: string;

  maxLocations: number | null;
  maxBrands: number | null;
  maxUsers: number | null;
  maxTerminals: number | null;
  maxMenuItems: number | null;

  featOnlineOrdering: boolean;
  featMultiBranch: boolean;
  featDeliveryMgmt: boolean;
  featQrOrdering: boolean;
  featKioskOrdering: boolean;
  featWhatsappOrdering: boolean;
  featGroupOrdering: boolean;
  featScheduledOrders: boolean;
  featLoyalty: boolean;
  featWallet: boolean;
  featCrm: boolean;
  featAggregatorSync: boolean;
  featAdvancedAnalytics: boolean;
  featFbrIntegration: boolean;
  featApiAccess: boolean;
  featWhiteLabel: boolean;
  featCustomDomain: boolean;

  trialDays: number;
  isActive: boolean;
  displayOrder: number;
};

const fields: DynamicField<PlanFormValues>[] = [
  {
    type: "input",
    name: "name",
    label: "Name",
    rules: { required: "Name is required" },
    colSpan: 6,
  },
  {
    type: "slug",
    name: "slug",
    label: "Slug",
    rules: { required: "Slug is required" },
    colSpan: 6,
  },

  { type: "textarea", name: "description", label: "Description", colSpan: 12 },

  {
    type: "input",
    name: "monthlyPrice",
    label: "Monthly price",
    placeholder: "1999.00",
    colSpan: 6,
  },
  {
    type: "input",
    name: "annualPrice",
    label: "Annual price",
    placeholder: "19999.00",
    colSpan: 6,
  },

  {
    type: "input",
    name: "maxLocations",
    label: "Max locations (blank = unlimited)",
    inputType: "number",
    rules: { valueAsNumber: true },
    colSpan: 4,
  },
  {
    type: "input",
    name: "maxBrands",
    label: "Max brands (blank = unlimited)",
    inputType: "number",
    rules: { valueAsNumber: true },
    colSpan: 4,
  },
  {
    type: "input",
    name: "maxUsers",
    label: "Max users (blank = unlimited)",
    inputType: "number",
    rules: { valueAsNumber: true },
    colSpan: 4,
  },
  {
    type: "input",
    name: "maxTerminals",
    label: "Max terminals (blank = unlimited)",
    inputType: "number",
    rules: { valueAsNumber: true },
    colSpan: 6,
  },
  {
    type: "input",
    name: "maxMenuItems",
    label: "Max menu items (blank = unlimited)",
    inputType: "number",
    rules: { valueAsNumber: true },
    colSpan: 6,
  },

  {
    type: "switch",
    name: "featOnlineOrdering",
    label: "Online ordering",
    colSpan: 4,
  },
  {
    type: "switch",
    name: "featDeliveryMgmt",
    label: "Delivery management",
    colSpan: 4,
  },
  { type: "switch", name: "featQrOrdering", label: "QR ordering", colSpan: 4 },
  {
    type: "switch",
    name: "featKioskOrdering",
    label: "Kiosk ordering",
    colSpan: 4,
  },
  {
    type: "switch",
    name: "featWhatsappOrdering",
    label: "WhatsApp ordering",
    colSpan: 4,
  },
  {
    type: "switch",
    name: "featGroupOrdering",
    label: "Group ordering",
    colSpan: 4,
  },
  {
    type: "switch",
    name: "featScheduledOrders",
    label: "Scheduled orders",
    colSpan: 4,
  },
  {
    type: "switch",
    name: "featMultiBranch",
    label: "Multi-branch",
    colSpan: 4,
  },
  { type: "switch", name: "featLoyalty", label: "Loyalty", colSpan: 4 },
  { type: "switch", name: "featWallet", label: "Wallet", colSpan: 4 },
  { type: "switch", name: "featCrm", label: "CRM", colSpan: 4 },
  {
    type: "switch",
    name: "featAggregatorSync",
    label: "Aggregator sync",
    colSpan: 4,
  },
  {
    type: "switch",
    name: "featAdvancedAnalytics",
    label: "Advanced analytics",
    colSpan: 4,
  },
  {
    type: "switch",
    name: "featFbrIntegration",
    label: "FBR integration",
    colSpan: 4,
  },
  { type: "switch", name: "featApiAccess", label: "API access", colSpan: 4 },
  { type: "switch", name: "featWhiteLabel", label: "White label", colSpan: 4 },
  {
    type: "switch",
    name: "featCustomDomain",
    label: "Custom domain",
    colSpan: 4,
  },

  {
    type: "input",
    name: "trialDays",
    label: "Trial days",
    inputType: "number",
    rules: { valueAsNumber: true, min: { value: 0, message: ">= 0" } },
    colSpan: 6,
  },
  {
    type: "input",
    name: "displayOrder",
    label: "Display order",
    inputType: "number",
    rules: { valueAsNumber: true },
    colSpan: 6,
  },
  {
    type: "switch",
    name: "isActive",
    label: "Active",
    helperText: "Inactive plans are hidden from the public catalog.",
    colSpan: 12,
  },
];

function toNullNumber(v: unknown): number | null {
  if (v === "" || v === undefined || v === null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function PlanForm(props: {
  mode: "create" | "edit";
  initial?: Plan | null;
  isSubmitting?: boolean;
  errorText?: string | null;
  onSubmit: (input: CreatePlanInput | UpdatePlanInput) => Promise<void> | void;
}) {
  const { mode, initial, isSubmitting, errorText, onSubmit } = props;

  return (
    <div className="rounded-xl border bg-background p-4 space-y-3">
      <div>
        <div className="text-base font-semibold">
          {mode === "create" ? "Create plan" : "Edit plan"}
        </div>
        {errorText ? (
          <div className="mt-1 text-sm text-destructive">{errorText}</div>
        ) : null}
      </div>

      <DynamicForm<PlanFormValues>
        fields={fields}
        defaultValues={{
          name: initial?.name ?? "",
          slug: initial?.slug ?? "",
          description: initial?.description ?? "",
          monthlyPrice: initial?.monthlyPrice ?? "",
          annualPrice: initial?.annualPrice ?? "",

          maxLocations: initial?.maxLocations ?? null,
          maxBrands: initial?.maxBrands ?? null,
          maxUsers: initial?.maxUsers ?? null,
          maxTerminals: initial?.maxTerminals ?? null,
          maxMenuItems: initial?.maxMenuItems ?? null,

          featOnlineOrdering: initial?.featOnlineOrdering ?? false,
          featMultiBranch: initial?.featMultiBranch ?? false,
          featDeliveryMgmt: initial?.featDeliveryMgmt ?? false,
          featQrOrdering: initial?.featQrOrdering ?? false,
          featKioskOrdering: initial?.featKioskOrdering ?? false,
          featWhatsappOrdering: initial?.featWhatsappOrdering ?? false,
          featGroupOrdering: initial?.featGroupOrdering ?? false,
          featScheduledOrders: initial?.featScheduledOrders ?? false,
          featLoyalty: initial?.featLoyalty ?? false,
          featWallet: initial?.featWallet ?? false,
          featCrm: initial?.featCrm ?? false,
          featAggregatorSync: initial?.featAggregatorSync ?? false,
          featAdvancedAnalytics: initial?.featAdvancedAnalytics ?? false,
          featFbrIntegration: initial?.featFbrIntegration ?? false,
          featApiAccess: initial?.featApiAccess ?? false,
          featWhiteLabel: initial?.featWhiteLabel ?? false,
          featCustomDomain: initial?.featCustomDomain ?? false,

          trialDays: initial?.trialDays ?? 14,
          isActive: initial?.isActive ?? true,
          displayOrder: initial?.displayOrder ?? 0,
        }}
        isSubmitting={isSubmitting}
        submitLabel={mode === "create" ? "Create" : "Save changes"}
        transformValues={(v) => ({
          ...v,
          name: v.name.trim(),
          slug: v.slug.trim().toLowerCase(),
          description: v.description.trim(),
          monthlyPrice: v.monthlyPrice.trim(),
          annualPrice: v.annualPrice.trim(),
        })}
        onSubmit={async (values) => {
          await onSubmit({
            name: values.name,
            slug: values.slug,
            description: values.description ? values.description : null,
            monthlyPrice: values.monthlyPrice ? values.monthlyPrice : null,
            annualPrice: values.annualPrice ? values.annualPrice : null,

            maxLocations: toNullNumber(values.maxLocations),
            maxBrands: toNullNumber(values.maxBrands),
            maxUsers: toNullNumber(values.maxUsers),
            maxTerminals: toNullNumber(values.maxTerminals),
            maxMenuItems: toNullNumber(values.maxMenuItems),

            featOnlineOrdering: values.featOnlineOrdering,
            featMultiBranch: values.featMultiBranch,
            featDeliveryMgmt: values.featDeliveryMgmt,
            featQrOrdering: values.featQrOrdering,
            featKioskOrdering: values.featKioskOrdering,
            featWhatsappOrdering: values.featWhatsappOrdering,
            featGroupOrdering: values.featGroupOrdering,
            featScheduledOrders: values.featScheduledOrders,
            featLoyalty: values.featLoyalty,
            featWallet: values.featWallet,
            featCrm: values.featCrm,
            featAggregatorSync: values.featAggregatorSync,
            featAdvancedAnalytics: values.featAdvancedAnalytics,
            featFbrIntegration: values.featFbrIntegration,
            featApiAccess: values.featApiAccess,
            featWhiteLabel: values.featWhiteLabel,
            featCustomDomain: values.featCustomDomain,

            trialDays: values.trialDays,
            isActive: values.isActive,
            displayOrder: values.displayOrder,
          });
        }}
      />
    </div>
  );
}
