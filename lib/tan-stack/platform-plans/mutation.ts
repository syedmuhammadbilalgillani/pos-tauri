"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PLATFORM_PLANS_KEYS } from "./key";
import {
  createPlanRequest,
  deletePlanRequest,
  updatePlanRequest,
  type CreatePlanInput,
  type UpdatePlanInput,
} from "./api";

export function useCreatePlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePlanInput) => createPlanRequest(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLATFORM_PLANS_KEYS.all() });
    },
  });
}

export function useUpdatePlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; input: UpdatePlanInput }) =>
      updatePlanRequest(args),
    onSuccess: (updated) => {
      qc.setQueryData(PLATFORM_PLANS_KEYS.byId(updated.id), updated);
      qc.invalidateQueries({ queryKey: PLATFORM_PLANS_KEYS.all() });
    },
  });
}

export function useDeletePlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deletePlanRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLATFORM_PLANS_KEYS.all() });
    },
  });
}