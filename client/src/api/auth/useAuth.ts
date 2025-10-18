import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiLogin,
  apiRegister,
  apiMe,
  apiLogout,
  type AuthResponse,
} from "./auth.api";
import type {
  LoginCredentials,
  RegisterData,
  User,
} from "../../modules/auth/types/auth";

export function useMe() {
  return useQuery<User>({
    queryKey: ["auth", "me"],
    queryFn: apiMe,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: apiLogin,
    onSuccess: (data) => {
      qc.setQueryData(["auth", "me"], data.user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: apiRegister,
    onSuccess: (data) => {
      qc.setQueryData(["auth", "me"], data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: apiLogout,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
