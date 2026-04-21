"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearAuthSession, saveAuthSession } from "./storage";
import { loginRequest } from "./api";
import { AUTH_KEYS } from "./key";

export function useLoginMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof loginRequest>[0]) => {
      const session = await loginRequest(input);
      await saveAuthSession(session);
      return session;
    },
    onSuccess: (session) => {
      qc.setQueryData(AUTH_KEYS.session(), session);
    },
  });
}

export function useLogoutMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await clearAuthSession();
    },
    onSuccess: () => {
      qc.setQueryData(AUTH_KEYS.session(), null);
    },
  });
}