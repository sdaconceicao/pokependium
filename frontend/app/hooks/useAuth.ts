import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { authApi, getStoredToken, requireStoredToken, setStoredToken } from "@/lib/auth";
import type {
  ChangePasswordCredentials,
  ChangePasswordResponse,
  EmailVerificationConfirmResponse,
  LoginCredentials,
  LoginResponse,
  PasswordResetConfirmCredentials,
  PasswordResetConfirmResponse,
  PasswordResetResponse,
  RegisterCredentials,
  RegisterResponse,
} from "@/types/auth";

export function useAuth() {
  const queryClient = useQueryClient();

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const {
    data: token,
    isLoading: isTokenLoading,
    error: tokenError,
  } = useQuery({
    queryKey: ["auth", "token"],
    queryFn: getStoredToken,
    staleTime: Infinity,
  });

  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery({
    queryKey: ["auth", "user", token],
    queryFn: token ? () => authApi.getCurrentUser(token) : skipToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: authApi.login,
    onSuccess: (data: LoginResponse) => {
      setStoredToken(data.access_token);
      queryClient.setQueryData(["auth", "token"], data.access_token);
    },
  });

  const registerMutation = useMutation<RegisterResponse, Error, RegisterCredentials>({
    mutationFn: authApi.register,
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "token"], null);
      queryClient.removeQueries({ queryKey: ["auth", "user"] });
      queryClient.removeQueries({ queryKey: ["groups"] });
    },
  });

  const requestPasswordResetMutation = useMutation<PasswordResetResponse, Error, string>({
    mutationFn: authApi.requestPasswordReset,
  });

  const confirmPasswordResetMutation = useMutation<
    PasswordResetConfirmResponse,
    Error,
    PasswordResetConfirmCredentials
  >({
    mutationFn: authApi.confirmPasswordReset,
    onSuccess: (data: PasswordResetConfirmResponse) => {
      setStoredToken(data.access_token);
      queryClient.setQueryData(["auth", "token"], data.access_token);
    },
  });

  const confirmEmailVerificationMutation = useMutation<
    EmailVerificationConfirmResponse,
    Error,
    string
  >({
    mutationFn: authApi.confirmEmailVerification,
    onSuccess: (data: EmailVerificationConfirmResponse) => {
      setStoredToken(data.access_token);
      queryClient.setQueryData(["auth", "token"], data.access_token);
    },
  });

  // No onSuccess: the access token is independent of the password hash.
  const changePasswordMutation = useMutation<
    ChangePasswordResponse,
    Error,
    ChangePasswordCredentials
  >({
    mutationFn: (credentials) => authApi.changePassword(requireStoredToken(), credentials),
  });

  return {
    user: hasMounted ? user : undefined,
    isLoading: isTokenLoading || isUserLoading,
    error: tokenError || userError,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    requestPasswordResetAsync: requestPasswordResetMutation.mutateAsync,
    isRequestPasswordResetLoading: requestPasswordResetMutation.isPending,
    confirmPasswordResetAsync: confirmPasswordResetMutation.mutateAsync,
    isConfirmPasswordResetLoading: confirmPasswordResetMutation.isPending,
    confirmEmailVerificationAsync: confirmEmailVerificationMutation.mutateAsync,
    isConfirmEmailVerificationLoading: confirmEmailVerificationMutation.isPending,
    changePasswordAsync: changePasswordMutation.mutateAsync,
    isChangePasswordLoading: changePasswordMutation.isPending,
  };
}

export function useIsAuthenticated() {
  const { user, isLoading } = useAuth();
  return { isAuthenticated: !!user, isLoading };
}
