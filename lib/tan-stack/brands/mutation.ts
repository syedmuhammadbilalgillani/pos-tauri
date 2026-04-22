"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loadAuthSession } from "@/lib/tan-stack/auth/storage";
import { BRANDS_KEYS } from "./key";
import {
  createBrandRequest,
  deactivateBrandRequest,
  deleteBrandRequest,
  updateBrandRequest,
  type CreateBrandInput,
  type UpdateBrandInput,
} from "./api";
import { toast } from "sonner";

export function useCreateBrandMutation() {
  const qc = useQueryClient();
  const tenantId = loadAuthSession()?.user?.tenantId ?? "";

  return useMutation({
    mutationFn: async (input: CreateBrandInput) => createBrandRequest(input),
    onSuccess: (created) => {
      // Cache strategy:
      // - invalidate list(s) so server becomes source of truth
      // - seed byId cache for instant navigation/detail
      qc.setQueryData(BRANDS_KEYS.byId(tenantId, created.id), created);
      qc.invalidateQueries({ queryKey: BRANDS_KEYS.all() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateBrandMutation() {
  const qc = useQueryClient();
  const tenantId = loadAuthSession()?.user?.tenantId ?? "";

  return useMutation({
    mutationFn: async (args: { id: string; input: UpdateBrandInput }) =>
      updateBrandRequest(args),
    onSuccess: (updated) => {
      qc.setQueryData(BRANDS_KEYS.byId(tenantId, updated.id), updated);
      qc.invalidateQueries({ queryKey: BRANDS_KEYS.all() });
    },
  });
}

export function useDeactivateBrandMutation() {
  const qc = useQueryClient();
  const tenantId = loadAuthSession()?.user?.tenantId ?? "";

  return useMutation({
    mutationFn: async (id: string) => deactivateBrandRequest(id),
    onSuccess: (updated) => {
      qc.setQueryData(BRANDS_KEYS.byId(tenantId, updated.id), updated);
      qc.invalidateQueries({ queryKey: BRANDS_KEYS.all() });
    },
  });
}

export function useDeleteBrandMutation() {
  const qc = useQueryClient();
  const tenantId = loadAuthSession()?.user?.tenantId ?? "";

  return useMutation({
    mutationFn: async (id: string) => deleteBrandRequest(id),
    onSuccess: (deleted) => {
      qc.invalidateQueries({ queryKey: BRANDS_KEYS.all() });
      qc.invalidateQueries({ queryKey: BRANDS_KEYS.byId(tenantId, deleted.id) });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}