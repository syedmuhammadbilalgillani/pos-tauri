"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PLATFORM_USERS_KEYS } from "./key";
import {
  createPlatformUserRequest,
  updatePlatformUserRequest,
  deactivatePlatformUserRequest,
  type CreatePlatformUserInput,
  type UpdatePlatformUserInput,
} from "./api";

export function useCreatePlatformUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePlatformUserInput) =>
      createPlatformUserRequest(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.all() });
    },
  });
}

export function useUpdatePlatformUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; input: UpdatePlatformUserInput }) =>
      updatePlatformUserRequest(args),
    onSuccess: (updated) => {
      qc.setQueryData(PLATFORM_USERS_KEYS.byId(updated.id), updated);
      qc.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.all() });
    },
  });
}

export function useDeactivatePlatformUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deactivatePlatformUserRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLATFORM_USERS_KEYS.all() });
    },
  });
}
