import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, getStoredToken, requireStoredToken } from "@/lib/auth";
import type { AvatarMessageResponse, UploadAvatarVariables } from "@/types/auth";

/** Avatar is its own query so GET /users stays small. */
export function useAvatar() {
  const queryClient = useQueryClient();

  // Same token query key as useAuth so react-query dedupes.
  const { data: token } = useQuery({
    queryKey: ["auth", "token"],
    queryFn: getStoredToken,
    staleTime: Infinity,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["auth", "avatar", token],
    queryFn: token ? () => authApi.getAvatar(token) : skipToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["auth", "avatar"] });

  const uploadMutation = useMutation<AvatarMessageResponse, Error, UploadAvatarVariables>({
    mutationFn: ({ file, onProgress }) =>
      authApi.uploadAvatar(requireStoredToken(), file, onProgress),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation<AvatarMessageResponse, Error, void>({
    mutationFn: () => authApi.deleteAvatar(requireStoredToken()),
    onSuccess: invalidate,
  });

  return {
    // API null → lago undefined (initials fallback).
    avatarSrc: data?.image ?? undefined,
    isLoading,
    error,
    uploadAvatarAsync: uploadMutation.mutateAsync,
    isUploadLoading: uploadMutation.isPending,
    removeAvatarAsync: removeMutation.mutateAsync,
    isRemoveLoading: removeMutation.isPending,
  };
}
