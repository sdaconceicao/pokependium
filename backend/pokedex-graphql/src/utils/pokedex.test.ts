import { describe, expect, it } from "vitest";

import type { NameEntry, Pokedex } from "../datasources/pokemon-api.types";
import { convertPokedexToPokedexDetail, getDisplayName, getEnglishDescription } from "./pokedex";

const kanto: Pokedex = {
  id: 2,
  name: "kanto",
  is_main_series: true,
  descriptions: [
    { description: "Rot und Blau Pokémon", language: { name: "de", url: "" } },
    { description: "Red and Blue version Pokémon", language: { name: "en", url: "" } },
  ],
  names: [
    { name: "カントー", language: { name: "ja-hrkt", url: "" } },
    { name: "Kanto", language: { name: "en", url: "" } },
  ],
  pokemon_entries: [
    { entry_number: 1, pokemon_species: { name: "bulbasaur", url: "" } },
    { entry_number: 2, pokemon_species: { name: "ivysaur", url: "" } },
  ],
  region: { name: "kanto", url: "" },
  version_groups: [
    { name: "red-blue", url: "" },
    { name: "yellow", url: "" },
  ],
};

describe("getEnglishDescription", () => {
  it("should return the English description when present", () => {
    expect(getEnglishDescription(kanto.descriptions)).toBe("Red and Blue version Pokémon");
  });

  it("should return null when no language matches English", () => {
    expect(
      getEnglishDescription([
        { description: "Rot und Blau Pokémon", language: { name: "de", url: "" } },
      ]),
    ).toBeNull();
  });

  it("should return null when there are no descriptions at all", () => {
    expect(getEnglishDescription([])).toBeNull();
  });
});

describe("getDisplayName", () => {
  const named = (name: string): NameEntry[] => [{ name, language: { name: "en", url: "" } }];

  it("should prefer the API's name, which spells what the slug cannot", () => {
    expect(getDisplayName(named("Let’s Go Kanto"), "letsgo-kanto")).toBe("Let’s Go Kanto");
    expect(getDisplayName(named("Original Ula’ula"), "original-ulaula")).toBe("Original Ula’ula");
  });

  it("should keep an API name that adds words the slug lacks", () => {
    // The bare `hoenn` dex is "Original Hoenn" upstream — the API knows it is
    // one of a pair even though its slug doesn't say so.
    expect(getDisplayName(named("Original Hoenn"), "hoenn")).toBe("Original Hoenn");
  });

  it("should fall back to the slug when the API name dropped part of it", () => {
    expect(getDisplayName(named("Gallery"), "conquest-gallery")).toBe("Conquest Gallery");
    expect(getDisplayName(named("Lumiose"), "lumiose-city")).toBe("Lumiose City");
  });

  it("should keep an API name that only reorders the slug's words", () => {
    expect(getDisplayName(named("Central Kalos"), "kalos-central")).toBe("Central Kalos");
  });

  it("should title case the slug when there is no English name at all", () => {
    expect(getDisplayName([], "isle-of-armor")).toBe("Isle Of Armor");
  });
});

describe("convertPokedexToPokedexDetail", () => {
  it("should flatten the pokedex response into the schema shape", () => {
    expect(convertPokedexToPokedexDetail(kanto)).toEqual({
      id: "2",
      name: "kanto",
      displayName: "Kanto",
      description: "Red and Blue version Pokémon",
      region: "kanto",
      pokemonCount: 2,
      versionGroups: ["red-blue", "yellow"],
      isMainSeries: true,
    });
  });

  it("should count the entries rather than listing them", () => {
    expect(convertPokedexToPokedexDetail({ ...kanto, pokemon_entries: [] }).pokemonCount).toBe(0);
  });

  it("should return a null region for a dex that belongs to no single region", () => {
    expect(convertPokedexToPokedexDetail({ ...kanto, region: null }).region).toBeNull();
  });

  it("should humanize the slug when the dex has no English name", () => {
    const unnamed = { ...kanto, names: [] };

    expect(convertPokedexToPokedexDetail(unnamed).displayName).toBe("Kanto");
  });
});
