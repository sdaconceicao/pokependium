import { describe, expect, it } from "vitest";

import type { TypeResponse, TypeSprites } from "../datasources/pokemon-api.types";
import type { TypeDamageRelations, TypeDetail } from "../types";
import { buildPokemonMatchups, convertTypeToTypeDetail, getTypeSprite } from "./type";

const named = (...names: string[]) => names.map((name) => ({ name, url: "" }));

const sprites: TypeSprites = {
  "generation-iii": { emerald: { name_icon: "iii/emerald.png", symbol_icon: null } },
  "generation-ix": {
    "scarlet-violet": { name_icon: "ix/name.png", symbol_icon: "ix/symbol.png" },
  },
  "generation-viii": {
    "sword-shield": { name_icon: "viii/name.png", symbol_icon: "viii/symbol.png" },
  },
};

const fire = {
  id: 10,
  name: "fire",
  names: [
    { name: "ほのお", language: { name: "ja-hrkt", url: "" } },
    { name: "Fire", language: { name: "en", url: "" } },
  ],
  generation: { name: "generation-i", url: "" },
  damage_relations: {
    double_damage_to: named("grass", "ice", "bug", "steel"),
    half_damage_to: named("fire", "water", "rock", "dragon"),
    no_damage_to: [],
    double_damage_from: named("ground", "rock", "water"),
    half_damage_from: named("fire", "grass", "ice", "bug", "steel", "fairy"),
    no_damage_from: [],
  },
  pokemon: new Array(109).fill({ slot: 1, pokemon: { name: "charmander", url: "" } }),
  moves: new Array(47).fill({ name: "fire-punch", url: "" }),
  sprites,
} as unknown as TypeResponse;

describe("getTypeSprite", () => {
  it("prefers the newest generation's symbol icon", () => {
    expect(getTypeSprite(sprites)).toBe("ix/symbol.png");
  });

  it("falls back to another generation's symbol icon", () => {
    const older: TypeSprites = {
      "generation-viii": {
        "sword-shield": { name_icon: "viii/name.png", symbol_icon: "viii/symbol.png" },
      },
    };

    expect(getTypeSprite(older)).toBe("viii/symbol.png");
  });

  it("falls back to a name badge when no symbol exists", () => {
    const nameOnly: TypeSprites = {
      "generation-iii": { emerald: { name_icon: "iii/emerald.png", symbol_icon: null } },
    };

    expect(getTypeSprite(nameOnly)).toBe("iii/emerald.png");
  });

  it("returns null when there are no icons at all", () => {
    expect(getTypeSprite({})).toBeNull();
    expect(getTypeSprite(undefined)).toBeNull();
  });
});

describe("convertTypeToTypeDetail", () => {
  it("flattens the type response into the schema shape", () => {
    expect(convertTypeToTypeDetail(fire)).toEqual({
      id: "10",
      name: "fire",
      displayName: "Fire",
      generation: "generation-i",
      sprite: "ix/symbol.png",
      pokemonCount: 109,
      moveCount: 47,
      damageRelations: {
        doubleDamageTo: ["grass", "ice", "bug", "steel"],
        halfDamageTo: ["fire", "water", "rock", "dragon"],
        noDamageTo: [],
        doubleDamageFrom: ["ground", "rock", "water"],
        halfDamageFrom: ["fire", "grass", "ice", "bug", "steel", "fairy"],
        noDamageFrom: [],
      },
    });
  });

  it("returns a null generation when the type has none", () => {
    const orphan = { ...fire, generation: undefined } as unknown as TypeResponse;

    expect(convertTypeToTypeDetail(orphan).generation).toBeNull();
  });
});

/** A TypeDetail carrying only what the matchup maths reads. */
const detail = (name: string, relations: Partial<TypeDamageRelations>): TypeDetail => ({
  id: "0",
  name,
  displayName: name,
  generation: null,
  sprite: null,
  pokemonCount: 0,
  moveCount: 0,
  damageRelations: {
    doubleDamageTo: [],
    halfDamageTo: [],
    noDamageTo: [],
    doubleDamageFrom: [],
    halfDamageFrom: [],
    noDamageFrom: [],
    ...relations,
  },
});

// Straight from PokeAPI, so a fixture can't drift from the real chart
const fireDetail = detail("fire", {
  halfDamageTo: ["rock", "fire", "water", "dragon"],
  doubleDamageTo: ["bug", "steel", "grass", "ice"],
  halfDamageFrom: ["bug", "steel", "fire", "grass", "ice", "fairy"],
  doubleDamageFrom: ["ground", "rock", "water"],
});
const flyingDetail = detail("flying", {
  halfDamageTo: ["rock", "steel", "electric"],
  doubleDamageTo: ["fighting", "bug", "grass"],
  noDamageFrom: ["ground"],
  halfDamageFrom: ["fighting", "bug", "grass"],
  doubleDamageFrom: ["rock", "electric", "ice"],
});
const steelDetail = detail("steel", {
  halfDamageTo: ["steel", "fire", "water", "electric"],
  doubleDamageTo: ["rock", "ice", "fairy"],
  noDamageFrom: ["poison"],
  halfDamageFrom: [
    "normal",
    "flying",
    "rock",
    "bug",
    "steel",
    "grass",
    "psychic",
    "ice",
    "dragon",
    "fairy",
  ],
  doubleDamageFrom: ["fighting", "ground", "fire"],
});
const grassDetail = detail("grass", {
  halfDamageTo: ["flying", "poison", "bug", "steel", "fire", "grass", "dragon"],
  doubleDamageTo: ["ground", "rock", "water"],
  halfDamageFrom: ["ground", "water", "grass", "electric"],
  doubleDamageFrom: ["flying", "poison", "bug", "fire", "ice"],
});
const poisonDetail = detail("poison", {
  noDamageTo: ["steel"],
  halfDamageTo: ["poison", "ground", "rock", "ghost"],
  doubleDamageTo: ["grass", "fairy"],
  halfDamageFrom: ["fighting", "poison", "bug", "grass", "fairy"],
  doubleDamageFrom: ["ground", "psychic"],
});

/** The multiplier the payload reports for one attacker, or 1 when it was
 *  dropped for being neutral. */
const against = (types: TypeDetail[], attacker: string) =>
  buildPokemonMatchups(types).defending.find(({ type }) => type === attacker)?.multiplier ?? 1;

describe("buildPokemonMatchups: defending", () => {
  it("stacks a shared weakness into 4x", () => {
    // Charizard's famous rock problem: 2x from each half
    expect(against([fireDetail, flyingDetail], "rock")).toBe(4);
  });

  it("stacks a shared resistance into a quarter", () => {
    expect(against([fireDetail, flyingDetail], "grass")).toBe(0.25);
  });

  it("lets an immunity beat the other half's weakness", () => {
    // Skarmory takes nothing from ground, though steel alone takes double
    expect(against([steelDetail, flyingDetail], "ground")).toBe(0);
    expect(against([steelDetail], "ground")).toBe(2);
  });

  it("drops a matchup that cancels to exactly neutral", () => {
    // fire resists ice, flying is weak to it — the two land on 1x and the type
    // must be absent, not reported as neutral
    const { defending } = buildPokemonMatchups([fireDetail, flyingDetail]);

    expect(defending.map(({ type }) => type)).not.toContain("ice");
  });

  it("never reports a 1x entry at all", () => {
    const { defending } = buildPokemonMatchups([grassDetail, poisonDetail]);

    expect(defending.every(({ multiplier }) => multiplier !== 1)).toBe(true);
  });

  it("reads a single type straight through", () => {
    expect(against([grassDetail], "fire")).toBe(2);
    expect(against([grassDetail], "water")).toBe(0.5);
  });

  it("gives Bulbasaur its real spread", () => {
    const { defending } = buildPokemonMatchups([grassDetail, poisonDetail]);

    expect(defending).toEqual([
      { type: "fire", multiplier: 2 },
      { type: "flying", multiplier: 2 },
      { type: "ice", multiplier: 2 },
      { type: "psychic", multiplier: 2 },
      { type: "electric", multiplier: 0.5 },
      { type: "fairy", multiplier: 0.5 },
      { type: "fighting", multiplier: 0.5 },
      { type: "water", multiplier: 0.5 },
      { type: "grass", multiplier: 0.25 },
    ]);
  });

  it("orders heaviest first, then alphabetically", () => {
    const multipliers = buildPokemonMatchups([grassDetail, poisonDetail]).defending.map(
      ({ multiplier }) => multiplier,
    );

    expect([...multipliers]).toEqual([...multipliers].sort((a, b) => b - a));
  });
});

describe("buildPokemonMatchups: attacking", () => {
  it("keeps one reading per type rather than combining them", () => {
    const { attacking } = buildPokemonMatchups([fireDetail, flyingDetail]);

    expect(attacking.map(({ type }) => type)).toEqual(["fire", "flying"]);
    // Both halves are 2x into grass. Combined that would read 4x, which no
    // offensive matchup ever is.
    expect(attacking.every(({ superEffective }) => superEffective.includes("grass"))).toBe(true);
  });

  it("carries each type's own three lists", () => {
    const { attacking } = buildPokemonMatchups([poisonDetail]);

    expect(attacking).toEqual([
      {
        type: "poison",
        superEffective: ["grass", "fairy"],
        notVeryEffective: ["poison", "ground", "rock", "ghost"],
        noEffect: ["steel"],
      },
    ]);
  });
});
