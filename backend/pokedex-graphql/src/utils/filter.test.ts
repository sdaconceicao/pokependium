import { describe, expect, it } from "vitest";

import type { PokemonIndex } from "../datasources/pokemon-api.types";
import { PokemonSort } from "../types";
import { byName, byNumber, intersect, sortByNumber, sortResults, union } from "./filter";

const entry = (number: number, name: string): PokemonIndex => ({
  id: String(number),
  name,
  number,
});

const charmander = entry(4, "charmander");
const charizard = entry(6, "charizard");
const squirtle = entry(7, "squirtle");
const pidgey = entry(16, "pidgey");
const moltres = entry(146, "moltres");

const names = (results: PokemonIndex[]) => results.map((result) => result.name);

describe("sortByNumber", () => {
  it("orders by national dex number", () => {
    expect(names(sortByNumber([moltres, charmander, pidgey]))).toEqual([
      "charmander",
      "pidgey",
      "moltres",
    ]);
  });

  it("does not mutate the input", () => {
    const input = [moltres, charmander];
    sortByNumber(input);
    expect(names(input)).toEqual(["moltres", "charmander"]);
  });

  it("handles an empty list", () => {
    expect(sortByNumber([])).toEqual([]);
  });
});

describe("byNumber", () => {
  it("sorts ascending", () => {
    expect(byNumber(charmander, charizard)).toBeLessThan(0);
    expect(byNumber(charizard, charmander)).toBeGreaterThan(0);
    expect(byNumber(charizard, charizard)).toBe(0);
  });
});

describe("byName", () => {
  it("sorts alphabetically", () => {
    expect(byName(charmander, charizard)).toBeGreaterThan(0);
    expect(byName(charizard, charmander)).toBeLessThan(0);
    expect(byName(charizard, charizard)).toBe(0);
  });
});

describe("sortResults", () => {
  it("orders by national dex number ascending for ID_ASC", () => {
    expect(names(sortResults([moltres, charmander, pidgey], PokemonSort.IdAsc))).toEqual([
      "charmander",
      "pidgey",
      "moltres",
    ]);
  });

  it("orders by national dex number descending for ID_DESC", () => {
    expect(names(sortResults([moltres, charmander, pidgey], PokemonSort.IdDesc))).toEqual([
      "moltres",
      "pidgey",
      "charmander",
    ]);
  });

  it("orders alphabetically ascending for NAME_ASC", () => {
    expect(names(sortResults([moltres, charmander, pidgey], PokemonSort.NameAsc))).toEqual([
      "charmander",
      "moltres",
      "pidgey",
    ]);
  });

  it("orders alphabetically descending for NAME_DESC", () => {
    expect(names(sortResults([moltres, charmander, pidgey], PokemonSort.NameDesc))).toEqual([
      "pidgey",
      "moltres",
      "charmander",
    ]);
  });

  it("defaults to ID_ASC", () => {
    expect(names(sortResults([moltres, charmander, pidgey]))).toEqual([
      "charmander",
      "pidgey",
      "moltres",
    ]);
  });

  it("returns a new array and leaves the input untouched", () => {
    const input = [moltres, charmander, pidgey];
    const result = sortResults(input, PokemonSort.NameAsc);

    expect(result).not.toBe(input);
    expect(names(input)).toEqual(["moltres", "charmander", "pidgey"]);
  });
});

describe("union", () => {
  it("merges every list", () => {
    expect(names(union([[charmander], [squirtle]]))).toEqual(["charmander", "squirtle"]);
  });

  it("dedupes entries shared across lists", () => {
    expect(names(union([[charmander, charizard], [charizard]]))).toEqual([
      "charmander",
      "charizard",
    ]);
  });

  it("dedupes entries repeated within a single list", () => {
    expect(names(union([[charizard, charizard]]))).toEqual(["charizard"]);
  });

  it("returns nothing for no lists", () => {
    expect(union([])).toEqual([]);
  });

  it("ignores empty lists", () => {
    expect(names(union([[], [charmander], []]))).toEqual(["charmander"]);
  });
});

describe("intersect", () => {
  it("keeps only entries present in every group", () => {
    const fire = [charmander, charizard, moltres];
    const flying = [charizard, pidgey, moltres];
    expect(names(intersect([fire, flying]))).toEqual(["charizard", "moltres"]);
  });

  it("narrows further with each additional group", () => {
    const fire = [charmander, charizard, moltres];
    const flying = [charizard, pidgey, moltres];
    const kanto = [charmander, charizard, pidgey];
    expect(names(intersect([fire, flying, kanto]))).toEqual(["charizard"]);
  });

  it("returns nothing when the groups do not overlap", () => {
    expect(intersect([[charmander], [squirtle]])).toEqual([]);
  });

  it("returns the single group unchanged when there is only one", () => {
    expect(names(intersect([[charmander, squirtle]]))).toEqual(["charmander", "squirtle"]);
  });

  it("dedupes repeats within the first group", () => {
    expect(names(intersect([[charizard, charizard], [charizard]]))).toEqual(["charizard"]);
  });

  it("returns nothing for no groups, so callers must special-case an unfiltered search", () => {
    expect(intersect([])).toEqual([]);
  });

  it("returns nothing when any group is empty", () => {
    expect(intersect([[charmander], []])).toEqual([]);
  });
});

describe("facet composition", () => {
  // (types ANY OR dualType BOTH) AND pokedexes ANY — the shape pokemonFilter builds.
  it("ORs the dual-type pair into the type facet, then ANDs the rest", () => {
    const fire = [charmander, charizard, moltres];
    const grass = [squirtle]; // stand-in; only set membership matters here
    const flying = [charizard, pidgey, moltres];

    const dual = intersect([fire, flying]);
    const typeFacet = union([fire, grass, dual]);
    const pokedex = [charmander, charizard, squirtle, pidgey];

    expect(names(sortByNumber(intersect([typeFacet, pokedex])))).toEqual([
      "charmander",
      "charizard",
      "squirtle",
    ]);
  });
});
