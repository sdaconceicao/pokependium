import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../mocks/server";
import { PokemonAPI } from "./pokemon-api";

const api = () => new PokemonAPI({ cache: new InMemoryLRUCache() });

const loaded = async () => {
  const pokemonAPI = api();
  await pokemonAPI.loadPokemonIndex();
  return pokemonAPI;
};

beforeEach(() => {
  PokemonAPI.resetIndexes();
});

describe("loadPokemonIndex", () => {
  it("indexes species from the species endpoint", async () => {
    const pokemonAPI = await loaded();

    expect(pokemonAPI.getPokemonIndex().map(({ name }) => name)).toEqual([
      "bulbasaur",
      "ivysaur",
      "venusaur",
      "charmander",
      "charmeleon",
      "charizard",
    ]);
  });

  it("indexes only the alternate forms from the pokemon endpoint", async () => {
    const pokemonAPI = await loaded();

    expect(pokemonAPI.getFormsIndex()).toEqual([
      { id: "10034", name: "charizard-mega-x", number: 10034 },
      { id: "10186", name: "bulbasaur-gmax", number: 10186 },
      { id: "10199", name: "pikachu-gmax", number: 10199 },
    ]);
  });

  it("keeps no form in the species index", async () => {
    const pokemonAPI = await loaded();

    expect(pokemonAPI.getPokemonIndex().every(({ number }) => number < 10000)).toBe(true);
  });

  it("reports whether it has loaded", async () => {
    const pokemonAPI = api();
    expect(pokemonAPI.isIndexLoaded()).toBe(false);

    await pokemonAPI.loadPokemonIndex();
    expect(pokemonAPI.isIndexLoaded()).toBe(true);
  });

  it("throws rather than serving an empty index when asked before loading", () => {
    expect(() => api().getPokemonIndex()).toThrow("Pokemon index not loaded");
    expect(() => api().getFormsIndex()).toThrow("Pokemon index not loaded");
  });

  it("fetches each list once when several cold requests arrive together", async () => {
    let speciesRequests = 0;
    let pokemonRequests = 0;

    server.use(
      http.get("https://pokeapi.co/api/v2/pokemon-species", async () => {
        speciesRequests++;
        return passthroughList("pokemon-species");
      }),
      http.get("https://pokeapi.co/api/v2/pokemon", async () => {
        pokemonRequests++;
        return passthroughList("pokemon");
      }),
    );

    await Promise.all([
      api().loadPokemonIndex(),
      api().loadPokemonIndex(),
      api().loadPokemonIndex(),
    ]);

    expect(speciesRequests).toBe(1);
    expect(pokemonRequests).toBe(1);
  });

  it("retries after a failed load rather than latching the failure", async () => {
    server.use(
      http.get(
        "https://pokeapi.co/api/v2/pokemon-species",
        () => new HttpResponse(null, { status: 500 }),
        { once: true },
      ),
    );

    await expect(api().loadPokemonIndex()).rejects.toThrow();

    await expect(api().loadPokemonIndex()).resolves.toBeUndefined();
  });
});

describe("searchFormsIndex", () => {
  it("matches a substring that only ever appears in a form name", async () => {
    const pokemonAPI = await loaded();

    expect(pokemonAPI.searchFormsIndex("gmax").map(({ name }) => name)).toEqual([
      "bulbasaur-gmax",
      "pikachu-gmax",
    ]);
  });

  it("is case insensitive", async () => {
    const pokemonAPI = await loaded();

    expect(pokemonAPI.searchFormsIndex("MEGA")).toHaveLength(1);
  });

  it("does not reach into the species index", async () => {
    const pokemonAPI = await loaded();

    expect(pokemonAPI.searchFormsIndex("venusaur")).toEqual([]);
  });
});

describe("index immutability", () => {
  it("hands out the same array each time", async () => {
    const pokemonAPI = await loaded();

    expect(pokemonAPI.getPokemonIndex()).toBe(pokemonAPI.getPokemonIndex());
  });

  it("is not reordered by a caller sorting its results", async () => {
    const pokemonAPI = await loaded();
    const index = pokemonAPI.getPokemonIndex();

    [...index].sort((a, b) => b.number - a.number);

    expect(index.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("getFormsForSpecies", () => {
  it("returns every variety of the species", async () => {
    const forms = await api().getFormsForSpecies("1");

    expect(forms.map(({ name }) => name)).toEqual(["bulbasaur", "bulbasaur-gmax"]);
  });

  it("puts the default first, so the switcher can offer a way back", async () => {
    const forms = await api().getFormsForSpecies("1");

    expect(forms[0]).toMatchObject({ id: "1", isDefault: true });
    expect(forms[1]).toMatchObject({ id: "10186", isDefault: false });
  });

  it("falls back to official artwork for a form with no default sprite", async () => {
    const forms = await api().getFormsForSpecies("1");

    expect(forms[1].image).toBe(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10186.png",
    );
  });
});

describe("getDescriptionsForSpecies", () => {
  it("returns the species' blurbs oldest first, with the newest last", async () => {
    const descriptions = await api().getDescriptionsForSpecies("1");

    expect(descriptions.at(-1)).toEqual({
      text: "While it is young, it uses the nutrients in its seed.",
      versions: ["shield"],
    });
  });

  it("groups the games that ship identical text and skips other languages", async () => {
    const descriptions = await api().getDescriptionsForSpecies("1");

    expect(descriptions).toEqual([
      {
        text: "A strange seed was planted on its back at birth.",
        versions: ["red"],
      },
      {
        text: "It can go for days without eating a single morsel.",
        versions: ["blue", "leafgreen"],
      },
      {
        text: "While it is young, it uses the nutrients in its seed.",
        versions: ["shield"],
      },
    ]);
  });
});

describe("getEvolutionForSpecies", () => {
  it("resolves a chain for a species", async () => {
    const chain = await api().getEvolutionForSpecies("1");

    expect(chain.chain.name).toBe("bulbasaur");
  });

  it("is never given a form id by getPokemon's own output", async () => {
    const form = await api().getPokemon("10186");

    expect(form.speciesId).toBe("1");
    await expect(api().getEvolutionForSpecies(form.speciesId)).resolves.toBeDefined();
  });

  it("rejects when handed a form id", async () => {
    await expect(api().getEvolutionForSpecies("10186")).rejects.toThrow();
  });
});

describe("getPokemonByType", () => {
  it("drops alternate forms so it counts the same population as the other facets", async () => {
    server.use(
      http.get("https://pokeapi.co/api/v2/type/:type", () =>
        HttpResponse.json({
          pokemon: [
            { pokemon: { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" } },
            {
              pokemon: {
                name: "pikachu-gmax",
                url: "https://pokeapi.co/api/v2/pokemon/10199/",
              },
            },
          ],
        }),
      ),
    );

    const results = await api().getPokemonByType("electric");

    expect(results.map(({ name }) => name)).toEqual(["pikachu"]);
  });
});

async function passthroughList(resource: "pokemon" | "pokemon-species") {
  const { pokemonList, pokemonSpeciesList } = await import("../mocks/pokemon.js");
  return HttpResponse.json(resource === "pokemon" ? pokemonList : pokemonSpeciesList);
}
