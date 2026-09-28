import { describe, expect, it } from "vitest";

import type { Region } from "../datasources/pokemon-api.types";
import { convertRegionToRegionDetail, getEnglishName } from "./region";

const kanto: Region = {
  id: 1,
  name: "kanto",
  names: [
    { name: "カントー", language: { name: "ja-hrkt", url: "" } },
    { name: "Kanto", language: { name: "en", url: "" } },
  ],
  main_generation: { name: "generation-i", url: "" },
  locations: [
    { name: "pallet-town", url: "" },
    { name: "viridian-forest", url: "" },
  ],
  version_groups: [
    { name: "red-blue", url: "" },
    { name: "yellow", url: "" },
  ],
  pokedexes: [
    { name: "kanto", url: "" },
    { name: "letsgo-kanto", url: "" },
  ],
};

describe("getEnglishName", () => {
  it("should return the English name when present", () => {
    expect(getEnglishName(kanto.names, "kanto")).toBe("Kanto");
  });

  it("should fall back to the slug when there is no English name", () => {
    expect(
      getEnglishName([{ name: "カントー", language: { name: "ja-hrkt", url: "" } }], "kanto"),
    ).toBe("kanto");
  });

  it("should fall back to the slug when there are no names at all", () => {
    expect(getEnglishName([], "kanto")).toBe("kanto");
  });
});

describe("convertRegionToRegionDetail", () => {
  it("should flatten the region response into the schema shape", () => {
    expect(convertRegionToRegionDetail(kanto, 232)).toEqual({
      id: "1",
      name: "kanto",
      displayName: "Kanto",
      generation: "generation-i",
      pokemonCount: 232,
      locations: ["pallet-town", "viridian-forest"],
      pokedexes: ["kanto", "letsgo-kanto"],
      versionGroups: ["red-blue", "yellow"],
    });
  });

  it("should return a null generation when the region has no main generation", () => {
    const orphan = { ...kanto, main_generation: undefined } as unknown as Region;

    expect(convertRegionToRegionDetail(orphan, 0).generation).toBeNull();
  });
});
