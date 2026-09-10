import type {
  CreateGroupRequest,
  GroupMembership,
  GroupPokemon,
  PokemonGroup,
  UpdateGroupRequest,
} from "../types/groups";

const API_BASE_URL = process.env.NEXT_PUBLIC_REST_API_URL || "http://localhost:3007";

const groupUrl = (id?: string): string =>
  id ? `${API_BASE_URL}/groups/${encodeURIComponent(id)}` : `${API_BASE_URL}/groups`;

const groupPokemonUrl = (groupId: string, pokemonId?: string): string => {
  const base = `${groupUrl(groupId)}/pokemon`;
  return pokemonId ? `${base}/${encodeURIComponent(pokemonId)}` : base;
};

const groupMembershipsUrl = (): string => `${groupUrl()}/memberships`;

export const groupsApi = {
  async list(token: string): Promise<PokemonGroup[]> {
    const response = await fetch(groupUrl(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Fetching groups failed");
    }

    return response.json();
  },

  async create(token: string, body: CreateGroupRequest): Promise<PokemonGroup> {
    const response = await fetch(groupUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Creating group failed");
    }

    return response.json();
  },

  async update(token: string, id: string, body: UpdateGroupRequest): Promise<PokemonGroup> {
    const response = await fetch(groupUrl(id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Updating group failed");
    }

    return response.json();
  },

  async remove(token: string, id: string): Promise<void> {
    const response = await fetch(groupUrl(id), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Deleting group failed");
    }
  },

  async listPokemon(token: string, groupId: string): Promise<GroupPokemon[]> {
    const response = await fetch(groupPokemonUrl(groupId), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Fetching group pokemon failed");
    }

    return response.json();
  },

  async addPokemon(token: string, groupId: string, body: GroupPokemon): Promise<GroupPokemon> {
    const response = await fetch(groupPokemonUrl(groupId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Adding pokemon to group failed");
    }

    return response.json();
  },

  async removePokemon(token: string, groupId: string, pokemonId: string): Promise<void> {
    const response = await fetch(groupPokemonUrl(groupId, pokemonId), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Removing pokemon from group failed");
    }
  },

  async listMemberships(token: string): Promise<GroupMembership[]> {
    const response = await fetch(groupMembershipsUrl(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Fetching group memberships failed");
    }

    return response.json();
  },
};
