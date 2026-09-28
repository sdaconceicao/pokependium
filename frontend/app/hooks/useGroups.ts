import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requireStoredToken } from "@/lib/auth";
import { groupsApi } from "@/lib/groups";
import type { CreateGroupRequest, GroupPokemon, PokemonGroup, UpdateGroupRequest } from "@/types";
import { useAuth } from "./useAuth";

export function useGroups() {
  const { user } = useAuth();

  const {
    data: groups,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.list(requireStoredToken()),
    enabled: !!user,
  });

  const defaultGroup = groups?.find((group) => group.isDefault);

  return { groups, defaultGroup, isLoading, error };
}

export function useGroupMemberships() {
  const { user } = useAuth();

  const {
    data: memberships,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["groups", "memberships"],
    queryFn: () => groupsApi.listMemberships(requireStoredToken()),
    enabled: !!user,
  });

  return { memberships, isLoading, error };
}

export function useGroupPokemon(groupId: string | undefined) {
  const { user } = useAuth();

  const {
    data: pokemon,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["groups", groupId, "pokemon"],
    queryFn: groupId ? () => groupsApi.listPokemon(requireStoredToken(), groupId) : skipToken,
    enabled: !!user,
  });

  return { pokemon, isLoading, error };
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  const mutation = useMutation<PokemonGroup, Error, CreateGroupRequest>({
    mutationFn: (body) => groupsApi.create(requireStoredToken(), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  return {
    createGroup: mutation.mutate,
    createGroupAsync: mutation.mutateAsync,
    isCreateGroupLoading: mutation.isPending,
    createGroupError: mutation.error,
  };
}

interface UpdateGroupVariables {
  id: string;
  body: UpdateGroupRequest;
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  const mutation = useMutation<PokemonGroup, Error, UpdateGroupVariables>({
    mutationFn: ({ id, body }) => groupsApi.update(requireStoredToken(), id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  return {
    updateGroup: mutation.mutate,
    updateGroupAsync: mutation.mutateAsync,
    isUpdateGroupLoading: mutation.isPending,
    updateGroupError: mutation.error,
  };
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationFn: (id) => groupsApi.remove(requireStoredToken(), id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  return {
    deleteGroup: mutation.mutate,
    deleteGroupAsync: mutation.mutateAsync,
    isDeleteGroupLoading: mutation.isPending,
    deleteGroupError: mutation.error,
  };
}

interface AddPokemonToGroupVariables {
  groupId: string;
  body: GroupPokemon;
}

export function useAddPokemonToGroup() {
  const queryClient = useQueryClient();

  const mutation = useMutation<GroupPokemon, Error, AddPokemonToGroupVariables>({
    mutationFn: ({ groupId, body }) => groupsApi.addPokemon(requireStoredToken(), groupId, body),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "pokemon"] });
    },
  });

  return {
    addPokemonToGroup: mutation.mutate,
    addPokemonToGroupAsync: mutation.mutateAsync,
    isAddPokemonToGroupLoading: mutation.isPending,
    addPokemonToGroupError: mutation.error,
  };
}

interface RemovePokemonFromGroupVariables {
  groupId: string;
  pokemonId: string;
}

export function useRemovePokemonFromGroup() {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, RemovePokemonFromGroupVariables>({
    mutationFn: ({ groupId, pokemonId }) =>
      groupsApi.removePokemon(requireStoredToken(), groupId, pokemonId),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "pokemon"] });
    },
  });

  return {
    removePokemonFromGroup: mutation.mutate,
    removePokemonFromGroupAsync: mutation.mutateAsync,
    isRemovePokemonFromGroupLoading: mutation.isPending,
    removePokemonFromGroupError: mutation.error,
  };
}
