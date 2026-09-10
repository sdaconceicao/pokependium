import { groupsApi } from "./groups";

const API_BASE_URL = "http://localhost:3007";
const TOKEN = "test-token";

const GROUP = { id: "1", name: "Favorites", isDefault: true, pokemonCount: 2 };
const GROUP_POKEMON = { pokemonId: "25", speciesId: "25" };

function jsonResponse(ok: boolean, body: unknown) {
  return { ok, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

function unparsableErrorResponse() {
  return {
    ok: false,
    json: vi.fn().mockRejectedValue(new Error("not json")),
  } as unknown as Response;
}

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("groupsApi.list", () => {
  it("GETs /groups with the bearer token and returns the body", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(true, [GROUP]));

    const result = await groupsApi.list(TOKEN);

    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/groups`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(result).toEqual([GROUP]);
  });

  it("throws the server message on failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(false, { message: "denied" }));

    await expect(groupsApi.list(TOKEN)).rejects.toThrow("denied");
  });

  it("falls back to a default message when the body can't be parsed", async () => {
    vi.mocked(global.fetch).mockResolvedValue(unparsableErrorResponse());

    await expect(groupsApi.list(TOKEN)).rejects.toThrow("Fetching groups failed");
  });
});

describe("groupsApi.create", () => {
  it("POSTs /groups with the body and bearer token", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(true, GROUP));

    const result = await groupsApi.create(TOKEN, { name: "Favorites" });

    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ name: "Favorites" }),
    });
    expect(result).toEqual(GROUP);
  });

  it("throws the server message on failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(false, { message: "taken" }));

    await expect(groupsApi.create(TOKEN, { name: "Favorites" })).rejects.toThrow("taken");
  });

  it("falls back to a default message when the body can't be parsed", async () => {
    vi.mocked(global.fetch).mockResolvedValue(unparsableErrorResponse());

    await expect(groupsApi.create(TOKEN, { name: "Favorites" })).rejects.toThrow(
      "Creating group failed",
    );
  });
});

describe("groupsApi.update", () => {
  it("PATCHes /groups/:id, encoding the id, with the body and bearer token", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(true, GROUP));

    const result = await groupsApi.update(TOKEN, "id with spaces", { name: "New name" });

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/groups/${encodeURIComponent("id with spaces")}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ name: "New name" }),
      },
    );
    expect(result).toEqual(GROUP);
  });

  it("throws the server message on failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(false, { message: "not found" }));

    await expect(groupsApi.update(TOKEN, "1", { name: "x" })).rejects.toThrow("not found");
  });

  it("falls back to a default message when the body can't be parsed", async () => {
    vi.mocked(global.fetch).mockResolvedValue(unparsableErrorResponse());

    await expect(groupsApi.update(TOKEN, "1", { name: "x" })).rejects.toThrow(
      "Updating group failed",
    );
  });
});

describe("groupsApi.remove", () => {
  it("DELETEs /groups/:id and does not parse a body on success", async () => {
    const json = vi.fn();
    vi.mocked(global.fetch).mockResolvedValue({ ok: true, json } as unknown as Response);

    const result = await groupsApi.remove(TOKEN, "1");

    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/groups/1`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(json).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("throws the server message on failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(false, { message: "not found" }));

    await expect(groupsApi.remove(TOKEN, "1")).rejects.toThrow("not found");
  });

  it("falls back to a default message when the body can't be parsed", async () => {
    vi.mocked(global.fetch).mockResolvedValue(unparsableErrorResponse());

    await expect(groupsApi.remove(TOKEN, "1")).rejects.toThrow("Deleting group failed");
  });
});

describe("groupsApi.listPokemon", () => {
  it("GETs /groups/:id/pokemon with the bearer token", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(true, [GROUP_POKEMON]));

    const result = await groupsApi.listPokemon(TOKEN, "1");

    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/groups/1/pokemon`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(result).toEqual([GROUP_POKEMON]);
  });

  it("throws the server message on failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(false, { message: "denied" }));

    await expect(groupsApi.listPokemon(TOKEN, "1")).rejects.toThrow("denied");
  });

  it("falls back to a default message when the body can't be parsed", async () => {
    vi.mocked(global.fetch).mockResolvedValue(unparsableErrorResponse());

    await expect(groupsApi.listPokemon(TOKEN, "1")).rejects.toThrow(
      "Fetching group pokemon failed",
    );
  });
});

describe("groupsApi.addPokemon", () => {
  it("POSTs /groups/:id/pokemon, encoding the group id, with the body and bearer token", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(true, GROUP_POKEMON));

    const result = await groupsApi.addPokemon(TOKEN, "group id", GROUP_POKEMON);

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/groups/${encodeURIComponent("group id")}/pokemon`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(GROUP_POKEMON),
      },
    );
    expect(result).toEqual(GROUP_POKEMON);
  });

  it("throws the server message on failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(false, { message: "full" }));

    await expect(groupsApi.addPokemon(TOKEN, "1", GROUP_POKEMON)).rejects.toThrow("full");
  });

  it("falls back to a default message when the body can't be parsed", async () => {
    vi.mocked(global.fetch).mockResolvedValue(unparsableErrorResponse());

    await expect(groupsApi.addPokemon(TOKEN, "1", GROUP_POKEMON)).rejects.toThrow(
      "Adding pokemon to group failed",
    );
  });
});

describe("groupsApi.removePokemon", () => {
  it("DELETEs /groups/:id/pokemon/:pokemonId, encoding both ids, and does not parse a body on success", async () => {
    const json = vi.fn();
    vi.mocked(global.fetch).mockResolvedValue({ ok: true, json } as unknown as Response);

    const result = await groupsApi.removePokemon(TOKEN, "group id", "pokemon id");

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/groups/${encodeURIComponent("group id")}/pokemon/${encodeURIComponent("pokemon id")}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
      },
    );
    expect(json).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("throws the server message on failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(false, { message: "not found" }));

    await expect(groupsApi.removePokemon(TOKEN, "1", "25")).rejects.toThrow("not found");
  });

  it("falls back to a default message when the body can't be parsed", async () => {
    vi.mocked(global.fetch).mockResolvedValue(unparsableErrorResponse());

    await expect(groupsApi.removePokemon(TOKEN, "1", "25")).rejects.toThrow(
      "Removing pokemon from group failed",
    );
  });
});

describe("groupsApi.listMemberships", () => {
  const MEMBERSHIP = { groupId: "1", pokemonId: "25" };

  it("GETs /groups/memberships with the bearer token and returns the body", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(true, [MEMBERSHIP]));

    const result = await groupsApi.listMemberships(TOKEN);

    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/groups/memberships`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(result).toEqual([MEMBERSHIP]);
  });

  it("throws the server message on failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(false, { message: "denied" }));

    await expect(groupsApi.listMemberships(TOKEN)).rejects.toThrow("denied");
  });

  it("falls back to a default message when the body can't be parsed", async () => {
    vi.mocked(global.fetch).mockResolvedValue(unparsableErrorResponse());

    await expect(groupsApi.listMemberships(TOKEN)).rejects.toThrow(
      "Fetching group memberships failed",
    );
  });
});
