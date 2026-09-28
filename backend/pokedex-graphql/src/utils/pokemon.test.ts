import { describe, expect, it } from "vitest";

import type {
  EvolutionDetail,
  PokemonAbility,
  PokemonEntity,
  PokemonSpecies,
  SpeciesFlavorTextEntry,
} from "../datasources/pokemon-api.types";
import { createPokemonAbility, createPokemonEntity } from "../test/mock-api-types";
import type { AbilityLite } from "../types";
import { decimetersToFeet, hectogramsToPounds } from "./conversion";
import {
  convertAbilityLiteToAbility,
  convertPokemonEntityToPokemon,
  getEvolutionDetail,
  getIdFromUrl,
  getLatestDescription,
  getPokemonAbilitiesLite,
  getPokemonDefaultImageUrl,
  getPokemonStats,
  getPokemonTypes,
  getSpeciesDescriptions,
  toPokemonIndex,
} from "./pokemon";

describe("getPokemonAbilitiesLite", () => {
  it("should extract ability information correctly", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      abilities: [
        {
          ability: {
            name: "overgrow",
            url: "https://pokeapi.co/api/v2/ability/65/",
          },
          is_hidden: false,
          slot: 1,
        },
        {
          ability: {
            name: "chlorophyll",
            url: "https://pokeapi.co/api/v2/ability/34/",
          },
          is_hidden: true,
          slot: 3,
        },
      ],
    });

    const result = getPokemonAbilitiesLite(mockPokemon);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "65",
      name: "overgrow",
      url: "https://pokeapi.co/api/v2/ability/65/",
      isHidden: false,
      slot: 1,
    });
    expect(result[1]).toEqual({
      id: "34",
      name: "chlorophyll",
      url: "https://pokeapi.co/api/v2/ability/34/",
      isHidden: true,
      slot: 3,
    });
  });

  it("should handle empty abilities array", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      abilities: [],
    });

    const result = getPokemonAbilitiesLite(mockPokemon);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should handle ability URL with trailing slash", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      abilities: [
        {
          ability: {
            name: "overgrow",
            url: "https://pokeapi.co/api/v2/ability/65/",
          },
          is_hidden: false,
          slot: 1,
        },
      ],
    });

    const result = getPokemonAbilitiesLite(mockPokemon);

    expect(result[0].id).toBe("65");
  });

  it("should handle ability URL without trailing slash", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      abilities: [
        {
          ability: {
            name: "overgrow",
            url: "https://pokeapi.co/api/v2/ability/65",
          },
          is_hidden: false,
          slot: 1,
        },
      ],
    });

    const result = getPokemonAbilitiesLite(mockPokemon);

    expect(result[0].id).toBe("65");
  });
});

describe("getPokemonDefaultImageUrl", () => {
  it("should return front_default sprite when available", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      sprites: {
        front_default:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
        front_shiny: null,
        back_default: null,
        back_shiny: null,
        other: {
          "official-artwork": {
            front_default:
              "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
            front_shiny:
              "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/1.png",
          },
          home: {
            front_default: null,
            front_shiny: null,
          },
          dream_world: {
            front_default: null,
            front_shiny: null,
          },
          showdown: {
            front_default: null,
            front_shiny: null,
          },
        },
      },
    });

    const result = getPokemonDefaultImageUrl(mockPokemon);

    expect(result).toBe(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    );
  });

  it("should fallback to front_shiny when front_default is null", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      sprites: {
        front_default: null,
        front_shiny:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png",
        back_default: null,
        back_shiny: null,
        other: {
          "official-artwork": {
            front_default:
              "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
            front_shiny:
              "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/1.png",
          },
          home: {
            front_default: null,
            front_shiny: null,
          },
          dream_world: {
            front_default: null,
            front_shiny: null,
          },
          showdown: {
            front_default: null,
            front_shiny: null,
          },
        },
      },
    });

    const result = getPokemonDefaultImageUrl(mockPokemon);

    expect(result).toBe(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png",
    );
  });

  it("should fallback to back_default when front sprites are null", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      sprites: {
        front_default: null,
        front_shiny: null,
        back_default:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/1.png",
        back_shiny: null,
        other: {
          "official-artwork": {
            front_default:
              "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
            front_shiny:
              "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/1.png",
          },
          home: {
            front_default: null,
            front_shiny: null,
          },
          dream_world: {
            front_default: null,
            front_shiny: null,
          },
          showdown: {
            front_default: null,
            front_shiny: null,
          },
        },
      },
    });

    const result = getPokemonDefaultImageUrl(mockPokemon);

    expect(result).toBe(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/1.png",
    );
  });

  it("should fallback to official-artwork when basic sprites are null", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      sprites: {
        front_default: null,
        front_shiny: null,
        back_default: null,
        back_shiny: null,
        other: {
          "official-artwork": {
            front_default:
              "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
            front_shiny:
              "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/1.png",
          },
          home: {
            front_default: null,
            front_shiny: null,
          },
          dream_world: {
            front_default: null,
            front_shiny: null,
          },
          showdown: {
            front_default: null,
            front_shiny: null,
          },
        },
      },
    });

    const result = getPokemonDefaultImageUrl(mockPokemon);

    expect(result).toBe(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
    );
  });

  it("should return placeholder image when no sprites are available", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      sprites: {
        front_default: null,
        front_shiny: null,
        back_default: null,
        back_shiny: null,
        other: {
          "official-artwork": {
            front_default: null,
            front_shiny: null,
          },
          home: {
            front_default: null,
            front_shiny: null,
          },
          dream_world: {
            front_default: null,
            front_shiny: null,
          },
          showdown: {
            front_default: null,
            front_shiny: null,
          },
        },
      },
    });

    const result = getPokemonDefaultImageUrl(mockPokemon);

    expect(result).toBe("https://dummyimage.com/96x96/f0f0f0/666666.png&text=bulbasaur");
  });

  it("should handle Pokemon name with special characters in placeholder", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "mr. mime",
      sprites: {
        front_default: null,
        front_shiny: null,
        back_default: null,
        back_shiny: null,
        other: {
          "official-artwork": {
            front_default: null,
            front_shiny: null,
          },
          home: {
            front_default: null,
            front_shiny: null,
          },
          dream_world: {
            front_default: null,
            front_shiny: null,
          },
          showdown: {
            front_default: null,
            front_shiny: null,
          },
        },
      },
    });

    const result = getPokemonDefaultImageUrl(mockPokemon);

    expect(result).toBe("https://dummyimage.com/96x96/f0f0f0/666666.png&text=mr.%20mime");
  });
});

describe("getPokemonTypes", () => {
  it("should extract type names correctly", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      types: [
        {
          slot: 1,
          type: { name: "grass", url: "https://pokeapi.co/api/v2/type/12/" },
        },
        {
          slot: 2,
          type: { name: "poison", url: "https://pokeapi.co/api/v2/type/4/" },
        },
      ],
    });

    const result = getPokemonTypes(mockPokemon);

    expect(result).toEqual(["grass", "poison"]);
  });

  it("should handle single type Pokemon", () => {
    const mockPokemon = createPokemonEntity({
      id: 25,
      name: "pikachu",
      types: [
        {
          slot: 1,
          type: { name: "electric", url: "https://pokeapi.co/api/v2/type/13/" },
        },
      ],
    });

    const result = getPokemonTypes(mockPokemon);

    expect(result).toEqual(["electric"]);
  });

  it("should handle Pokemon with no types", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      types: [],
    });

    const result = getPokemonTypes(mockPokemon);

    expect(result).toEqual([]);
  });

  it("should preserve type order based on slot", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      types: [
        {
          slot: 2,
          type: { name: "poison", url: "https://pokeapi.co/api/v2/type/4/" },
        },
        {
          slot: 1,
          type: { name: "grass", url: "https://pokeapi.co/api/v2/type/12/" },
        },
      ],
    });

    const result = getPokemonTypes(mockPokemon);

    expect(result).toEqual(["poison", "grass"]);
  });
});

describe("getPokemonStats", () => {
  it("should map all stats correctly", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      stats: [
        {
          base_stat: 45,
          effort: 0,
          stat: { name: "hp", url: "https://pokeapi.co/api/v2/stat/1/" },
        },
        {
          base_stat: 49,
          effort: 0,
          stat: { name: "attack", url: "https://pokeapi.co/api/v2/stat/2/" },
        },
        {
          base_stat: 49,
          effort: 0,
          stat: { name: "defense", url: "https://pokeapi.co/api/v2/stat/3/" },
        },
        {
          base_stat: 65,
          effort: 1,
          stat: {
            name: "special-attack",
            url: "https://pokeapi.co/api/v2/stat/4/",
          },
        },
        {
          base_stat: 65,
          effort: 0,
          stat: {
            name: "special-defense",
            url: "https://pokeapi.co/api/v2/stat/5/",
          },
        },
        {
          base_stat: 45,
          effort: 0,
          stat: { name: "speed", url: "https://pokeapi.co/api/v2/stat/6/" },
        },
      ],
    });

    const result = getPokemonStats(mockPokemon);

    expect(result).toEqual({
      hp: 45,
      attack: 49,
      defense: 49,
      specialAttack: 65,
      specialDefense: 65,
      speed: 45,
    });
  });

  it("should handle missing stats by defaulting to 0", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      stats: [
        {
          base_stat: 45,
          effort: 0,
          stat: { name: "hp", url: "https://pokeapi.co/api/v2/stat/1/" },
        },
        // Missing other stats
      ],
    });

    const result = getPokemonStats(mockPokemon);

    expect(result).toEqual({
      hp: 45,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
    });
  });

  it("should handle Pokemon with no stats", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      stats: [],
    });

    const result = getPokemonStats(mockPokemon);

    expect(result).toEqual({
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
    });
  });

  it("should handle stats in any order", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      stats: [
        {
          base_stat: 65,
          effort: 1,
          stat: {
            name: "special-attack",
            url: "https://pokeapi.co/api/v2/stat/4/",
          },
        },
        {
          base_stat: 45,
          effort: 0,
          stat: { name: "hp", url: "https://pokeapi.co/api/v2/stat/1/" },
        },
        {
          base_stat: 49,
          effort: 0,
          stat: { name: "attack", url: "https://pokeapi.co/api/v2/stat/2/" },
        },
      ],
    });

    const result = getPokemonStats(mockPokemon);

    expect(result).toEqual({
      hp: 45,
      attack: 49,
      defense: 0,
      specialAttack: 65,
      specialDefense: 0,
      speed: 0,
    });
  });

  it("should handle unknown stat names gracefully", () => {
    const mockPokemon = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      stats: [
        {
          base_stat: 45,
          effort: 0,
          stat: { name: "hp", url: "https://pokeapi.co/api/v2/stat/1/" },
        },
        {
          base_stat: 100,
          effort: 0,
          stat: {
            name: "unknown-stat",
            url: "https://pokeapi.co/api/v2/stat/99/",
          },
        },
      ],
    });

    const result = getPokemonStats(mockPokemon);

    expect(result).toEqual({
      hp: 45,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
    });
  });
});

describe("convertPokemonEntityToPokemon", () => {
  it("should convert PokemonEntity to Pokemon correctly", () => {
    const mockPokemonEntity = createPokemonEntity({
      id: 1,
      name: "bulbasaur",
      species: {
        name: "bulbasaur",
        url: "https://pokeapi.co/api/v2/pokemon-species/1/",
      },
      abilities: [
        {
          ability: {
            name: "overgrow",
            url: "https://pokeapi.co/api/v2/ability/65/",
          },
          is_hidden: false,
          slot: 1,
        },
        {
          ability: {
            name: "chlorophyll",
            url: "https://pokeapi.co/api/v2/ability/34/",
          },
          is_hidden: true,
          slot: 3,
        },
      ],
      types: [
        {
          slot: 1,
          type: { name: "grass", url: "https://pokeapi.co/api/v2/type/12/" },
        },
        {
          slot: 2,
          type: { name: "poison", url: "https://pokeapi.co/api/v2/type/4/" },
        },
      ],
      stats: [
        {
          base_stat: 45,
          effort: 0,
          stat: { name: "hp", url: "https://pokeapi.co/api/v2/stat/1/" },
        },
        {
          base_stat: 49,
          effort: 0,
          stat: { name: "attack", url: "https://pokeapi.co/api/v2/stat/2/" },
        },
        {
          base_stat: 49,
          effort: 0,
          stat: { name: "defense", url: "https://pokeapi.co/api/v2/stat/3/" },
        },
        {
          base_stat: 65,
          effort: 1,
          stat: {
            name: "special-attack",
            url: "https://pokeapi.co/api/v2/stat/4/",
          },
        },
        {
          base_stat: 65,
          effort: 0,
          stat: {
            name: "special-defense",
            url: "https://pokeapi.co/api/v2/stat/5/",
          },
        },
        {
          base_stat: 45,
          effort: 0,
          stat: { name: "speed", url: "https://pokeapi.co/api/v2/stat/6/" },
        },
      ],
      sprites: {
        front_default:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
        front_shiny: null,
        back_default: null,
        back_shiny: null,
        other: {
          "official-artwork": {
            front_default: null,
            front_shiny: null,
          },
          home: {
            front_default: null,
            front_shiny: null,
          },
          dream_world: {
            front_default: null,
            front_shiny: null,
          },
          showdown: {
            front_default: null,
            front_shiny: null,
          },
        },
      },
      height: 7,
      weight: 69,
    });

    const result = convertPokemonEntityToPokemon(mockPokemonEntity);

    expect(result).toEqual({
      id: "1",
      speciesId: "1",
      speciesName: "bulbasaur",
      name: "bulbasaur",
      type: ["grass", "poison"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
      height: decimetersToFeet(7),
      weight: hectogramsToPounds(69),
      stats: {
        hp: 45,
        attack: 49,
        defense: 49,
        specialAttack: 65,
        specialDefense: 65,
        speed: 45,
      },
      abilitiesLite: [
        {
          id: "65",
          name: "overgrow",
          url: "https://pokeapi.co/api/v2/ability/65/",
          isHidden: false,
          slot: 1,
        },
        {
          id: "34",
          name: "chlorophyll",
          url: "https://pokeapi.co/api/v2/ability/34/",
          isHidden: true,
          slot: 3,
        },
      ],
    });
  });

  it("should handle Pokemon with minimal data", () => {
    const mockPokemonEntity = createPokemonEntity({
      id: 999,
      name: "test-pokemon",
      species: {
        name: "test-pokemon",
        url: "https://pokeapi.co/api/v2/pokemon-species/999/",
      },
      abilities: [],
      types: [],
      stats: [],
      sprites: {
        front_default: null,
        front_shiny: null,
        back_default: null,
        back_shiny: null,
        other: {
          "official-artwork": {
            front_default: null,
            front_shiny: null,
          },
          home: {
            front_default: null,
            front_shiny: null,
          },
          dream_world: {
            front_default: null,
            front_shiny: null,
          },
          showdown: {
            front_default: null,
            front_shiny: null,
          },
        },
      },
      height: 0,
      weight: 0,
    });

    const result = convertPokemonEntityToPokemon(mockPokemonEntity);

    expect(result).toEqual({
      id: "999",
      speciesId: "999",
      speciesName: "test-pokemon",
      name: "test-pokemon",
      type: [],
      image: "https://dummyimage.com/96x96/f0f0f0/666666.png&text=test-pokemon",
      height: 0,
      weight: 0,
      stats: {
        hp: 0,
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
      },
      abilitiesLite: [],
    });
  });

  it("should convert ID to string", () => {
    const mockPokemonEntity = createPokemonEntity({
      id: 25,
      name: "pikachu",
      species: {
        name: "pikachu",
        url: "https://pokeapi.co/api/v2/pokemon-species/25/",
      },
      abilities: [],
      types: [],
      stats: [],
      sprites: {
        front_default: null,
        front_shiny: null,
        back_default: null,
        back_shiny: null,
        other: {
          "official-artwork": {
            front_default: null,
            front_shiny: null,
          },
          home: {
            front_default: null,
            front_shiny: null,
          },
          dream_world: {
            front_default: null,
            front_shiny: null,
          },
          showdown: {
            front_default: null,
            front_shiny: null,
          },
        },
      },
    });

    const result = convertPokemonEntityToPokemon(mockPokemonEntity);

    expect(result.id).toBe("25");
    expect(typeof result.id).toBe("string");
  });
});

describe("convertAbilityLiteToAbility", () => {
  it("should convert PokemonAbility and AbilityLite to Ability correctly", () => {
    const mockPokemonAbility = createPokemonAbility({
      id: 65,
      name: "overgrow",
      effect_entries: [
        {
          effect:
            "When this Pokémon has 1/3 or less of its maximum HP, its attacking moves inflict 1.5× as much regular damage.",
          short_effect: "Strengthens grass moves to inflict 1.5× damage at 1/3 max HP or less.",
          language: {
            name: "en",
            url: "https://pokeapi.co/api/v2/language/9/",
          },
        },
        {
          effect:
            "Quando questo Pokémon ha 1/3 o meno dei suoi PS massimi, le sue mosse d'attacco infliggono 1,5× più danni normali.",
          short_effect: "Potenzia le mosse erba per infliggere 1,5× danni a 1/3 PS max o meno.",
          language: {
            name: "it",
            url: "https://pokeapi.co/api/v2/language/8/",
          },
        },
      ],
      flavor_text_entries: [
        {
          flavor_text:
            "When this Pokémon has 1/3 or less of its maximum HP, its attacking moves inflict 1.5× as much regular damage.",
          language: {
            name: "en",
            url: "https://pokeapi.co/api/v2/language/9/",
          },
          version_group: {
            name: "sword-shield",
            url: "https://pokeapi.co/api/v2/version-group/20/",
          },
        },
        {
          flavor_text:
            "Quando questo Pokémon ha 1/3 o meno dei suoi PS massimi, le sue mosse d'attacco infliggono 1,5× più danni normali.",
          language: {
            name: "it",
            url: "https://pokeapi.co/api/v2/language/8/",
          },
          version_group: {
            name: "sword-shield",
            url: "https://pokeapi.co/api/v2/language/20/",
          },
        },
      ],
      generation: {
        name: "generation-iii",
        url: "https://pokeapi.co/api/v2/generation/3/",
      },
      is_main_series: true,
      pokemon: [],
    });

    const mockAbilityLite: AbilityLite = {
      id: "65",
      name: "overgrow",
      url: "https://pokeapi.co/api/v2/ability/65/",
      isHidden: false,
      slot: 1,
    };

    const result = convertAbilityLiteToAbility(mockPokemonAbility, mockAbilityLite);

    expect(result).toEqual({
      id: "65",
      name: "overgrow",
      description:
        "When this Pokémon has 1/3 or less of its maximum HP, its attacking moves inflict 1.5× as much regular damage.",
      effect:
        "When this Pokémon has 1/3 or less of its maximum HP, its attacking moves inflict 1.5× as much regular damage.",
      generation: "generation-iii",
      slot: 1,
    });
  });

  it("should handle missing English effect entries", () => {
    const mockPokemonAbility = createPokemonAbility({
      id: 66,
      name: "chlorophyll",
      effect_entries: [
        {
          effect: "This Pokémon's Speed is doubled during strong sunlight.",
          short_effect: "Doubles Speed during strong sunlight.",
          language: {
            name: "fr",
            url: "https://pokeapi.co/api/v2/language/5/",
          },
        },
      ],
      flavor_text_entries: [
        {
          flavor_text: "This Pokémon's Speed is doubled during strong sunlight.",
          language: {
            name: "en",
            url: "https://pokeapi.co/api/v2/language/9/",
          },
          version_group: {
            name: "sword-shield",
            url: "https://pokeapi.co/api/v2/version-group/20/",
          },
        },
      ],
      generation: {
        name: "generation-iii",
        url: "https://pokeapi.co/api/v2/generation/3/",
      },
      is_main_series: true,
      pokemon: [],
    });

    const mockAbilityLite: AbilityLite = {
      id: "66",
      name: "chlorophyll",
      url: "https://pokeapi.co/api/v2/ability/66/",
      isHidden: true,
      slot: 3,
    };

    const result = convertAbilityLiteToAbility(mockPokemonAbility, mockAbilityLite);

    expect(result).toEqual({
      id: "66",
      name: "chlorophyll",
      description: "This Pokémon's Speed is doubled during strong sunlight.",
      effect: "",
      generation: "generation-iii",
      slot: 3,
    });
  });

  it("should handle missing English flavor text entries", () => {
    const mockPokemonAbility = createPokemonAbility({
      id: 67,
      name: "blaze",
      effect_entries: [
        {
          effect:
            "When this Pokémon has 1/3 or less of its maximum HP, its attacking moves inflict 1.5× as much regular damage.",
          short_effect: "Strengthens fire moves to inflict 1.5× damage at 1/3 max HP or less.",
          language: {
            name: "en",
            url: "https://pokeapi.co/api/v2/language/9/",
          },
        },
      ],
      flavor_text_entries: [
        {
          flavor_text:
            "Quando questo Pokémon ha 1/3 o meno dei suoi PS massimi, le sue mosse d'attacco infliggono 1,5× più danni normali.",
          language: {
            name: "it",
            url: "https://pokeapi.co/api/v2/language/8/",
          },
          version_group: {
            name: "sword-shield",
            url: "https://pokeapi.co/api/v2/version-group/20/",
          },
        },
      ],
      generation: {
        name: "generation-iii",
        url: "https://pokeapi.co/api/v2/generation/3/",
      },
      is_main_series: true,
      pokemon: [],
    });

    const mockAbilityLite: AbilityLite = {
      id: "67",
      name: "blaze",
      url: "https://pokeapi.co/api/v2/ability/67/",
      isHidden: false,
      slot: 1,
    };

    const result = convertAbilityLiteToAbility(mockPokemonAbility, mockAbilityLite);

    expect(result).toEqual({
      id: "67",
      name: "blaze",
      description: "",
      effect:
        "When this Pokémon has 1/3 or less of its maximum HP, its attacking moves inflict 1.5× as much regular damage.",
      generation: "generation-iii",
      slot: 1,
    });
  });

  it("should handle empty effect and flavor text arrays", () => {
    const mockPokemonAbility = createPokemonAbility({
      id: 68,
      name: "torrent",
      effect_entries: [],
      flavor_text_entries: [],
      generation: {
        name: "generation-iii",
        url: "https://pokeapi.co/api/v2/generation/3/",
      },
      is_main_series: true,
      pokemon: [],
    });

    const mockAbilityLite: AbilityLite = {
      id: "68",
      name: "torrent",
      url: "https://pokeapi.co/api/v2/ability/68/",
      isHidden: false,
      slot: 1,
    };

    const result = convertAbilityLiteToAbility(mockPokemonAbility, mockAbilityLite);

    expect(result).toEqual({
      id: "68",
      name: "torrent",
      description: "",
      effect: "",
      generation: "generation-iii",
      slot: 1,
    });
  });

  it("should handle ability with multiple language entries", () => {
    const mockPokemonAbility = createPokemonAbility({
      id: 69,
      name: "swift-swim",
      effect_entries: [
        {
          effect: "This Pokémon's Speed is doubled during rain.",
          short_effect: "Doubles Speed during rain.",
          language: {
            name: "en",
            url: "https://pokeapi.co/api/v2/language/9/",
          },
        },
        {
          effect: "La Velocità di questo Pokémon raddoppia durante la pioggia.",
          short_effect: "Raddoppia la Velocità durante la pioggia.",
          language: {
            name: "it",
            url: "https://pokeapi.co/api/v2/language/8/",
          },
        },
        {
          effect: "La vitesse de ce Pokémon est doublée pendant la pluie.",
          short_effect: "Double la vitesse pendant la pluie.",
          language: {
            name: "fr",
            url: "https://pokeapi.co/api/v2/language/5/",
          },
        },
      ],
      flavor_text_entries: [
        {
          flavor_text: "This Pokémon's Speed is doubled during rain.",
          language: {
            name: "en",
            url: "https://pokeapi.co/api/v2/language/9/",
          },
          version_group: {
            name: "sword-shield",
            url: "https://pokeapi.co/api/v2/version-group/20/",
          },
        },
        {
          flavor_text: "La Velocità di questo Pokémon raddoppia durante la pioggia.",
          language: {
            name: "it",
            url: "https://pokeapi.co/api/v2/language/8/",
          },
          version_group: {
            name: "sword-shield",
            url: "https://pokeapi.co/api/v2/version-group/20/",
          },
        },
      ],
      generation: {
        name: "generation-iii",
        url: "https://pokeapi.co/api/v2/generation/3/",
      },
      is_main_series: true,
      pokemon: [],
    });

    const mockAbilityLite: AbilityLite = {
      id: "69",
      name: "swift-swim",
      url: "https://pokeapi.co/api/v2/ability/69/",
      isHidden: false,
      slot: 2,
    };

    const result = convertAbilityLiteToAbility(mockPokemonAbility, mockAbilityLite);

    expect(result).toEqual({
      id: "69",
      name: "swift-swim",
      description: "This Pokémon's Speed is doubled during rain.",
      effect: "This Pokémon's Speed is doubled during rain.",
      generation: "generation-iii",
      slot: 2,
    });
  });

  it("should convert ID to string correctly", () => {
    const mockPokemonAbility = createPokemonAbility({
      id: 999,
      name: "test-ability",
      effect_entries: [],
      flavor_text_entries: [],
      generation: {
        name: "generation-viii",
        url: "https://pokeapi.co/api/v2/generation/8/",
      },
      is_main_series: true,
      pokemon: [],
    });

    const mockAbilityLite: AbilityLite = {
      id: "999",
      name: "test-ability",
      url: "https://pokeapi.co/api/v2/ability/999/",
      isHidden: false,
      slot: 1,
    };

    const result = convertAbilityLiteToAbility(mockPokemonAbility, mockAbilityLite);

    expect(result.id).toBe("999");
    expect(typeof result.id).toBe("string");
  });

  it("should preserve slot value from AbilityLite", () => {
    const mockPokemonAbility = createPokemonAbility({
      id: 70,
      name: "water-absorb",
      effect_entries: [],
      flavor_text_entries: [],
      generation: {
        name: "generation-iii",
        url: "https://pokeapi.co/api/v2/generation/3/",
      },
      is_main_series: true,
      pokemon: [],
    });

    const mockAbilityLite: AbilityLite = {
      id: "70",
      name: "water-absorb",
      url: "https://pokeapi.co/api/v2/ability/70/",
      isHidden: true,
      slot: 5,
    };

    const result = convertAbilityLiteToAbility(mockPokemonAbility, mockAbilityLite);

    expect(result.slot).toBe(5);
    expect(typeof result.slot).toBe("number");
  });
});

describe("getIdFromUrl", () => {
  it("should extract the id from a url with a trailing slash", () => {
    expect(getIdFromUrl("https://pokeapi.co/api/v2/pokemon-species/1/")).toBe("1");
  });

  it("should extract the id from a url without a trailing slash", () => {
    expect(getIdFromUrl("https://pokeapi.co/api/v2/pokemon-species/25")).toBe("25");
  });

  it("should extract the id from an evolution-chain url", () => {
    expect(getIdFromUrl("https://pokeapi.co/api/v2/evolution-chain/67/")).toBe("67");
  });

  it("should return an empty string for an empty url", () => {
    expect(getIdFromUrl("")).toBe("");
  });
});

describe("getEvolutionDetail", () => {
  it("should extract min level and trigger from a level-up evolution", () => {
    const details: EvolutionDetail[] = [
      {
        min_level: 16,
        trigger: { name: "level-up", url: "" },
        item: null,
      },
    ];

    expect(getEvolutionDetail(details)).toEqual({
      minLevel: 16,
      trigger: "level-up",
      item: null,
    });
  });

  it("should extract the item from a use-item evolution", () => {
    const details: EvolutionDetail[] = [
      {
        min_level: null,
        trigger: { name: "use-item", url: "" },
        item: { name: "water-stone", url: "" },
      },
    ];

    expect(getEvolutionDetail(details)).toEqual({
      minLevel: null,
      trigger: "use-item",
      item: "water-stone",
    });
  });

  it("should return null fields for the base form (empty details)", () => {
    expect(getEvolutionDetail([])).toEqual({
      minLevel: null,
      trigger: null,
      item: null,
    });
  });

  it("should use only the first detail when several are present", () => {
    const details: EvolutionDetail[] = [
      {
        min_level: 30,
        trigger: { name: "level-up", url: "" },
        item: null,
      },
      {
        min_level: null,
        trigger: { name: "use-item", url: "" },
        item: { name: "sun-stone", url: "" },
      },
    ];

    expect(getEvolutionDetail(details)).toEqual({
      minLevel: 30,
      trigger: "level-up",
      item: null,
    });
  });
});

describe("toPokemonIndex", () => {
  it("builds an index entry from a resource with a trailing slash", () => {
    expect(
      toPokemonIndex({
        name: "bulbasaur",
        url: "https://pokeapi.co/api/v2/pokemon/1/",
      }),
    ).toEqual({ id: "1", name: "bulbasaur", number: 1 });
  });

  it("builds an index entry from a species resource without a trailing slash", () => {
    expect(
      toPokemonIndex({
        name: "pikachu",
        url: "https://pokeapi.co/api/v2/pokemon-species/25",
      }),
    ).toEqual({ id: "25", name: "pikachu", number: 25 });
  });

  it("derives a numeric dex number usable for sorting", () => {
    const entries = [
      { name: "venusaur", url: "https://pokeapi.co/api/v2/pokemon/3/" },
      { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
      { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" },
    ];

    const sorted = entries.map(toPokemonIndex).sort((a, b) => a.number - b.number);

    expect(sorted.map((p) => p.name)).toEqual(["bulbasaur", "ivysaur", "venusaur"]);
  });
});

const flavorEntry = (
  flavor_text: string,
  version: string,
  language = "en",
): SpeciesFlavorTextEntry => ({
  flavor_text,
  language: { name: language, url: "" },
  version: { name: version, url: "" },
});

const speciesWithEntries = (flavor_text_entries: SpeciesFlavorTextEntry[]): PokemonSpecies => ({
  id: 1,
  name: "bulbasaur",
  evolution_chain: { url: "" },
  flavor_text_entries,
  varieties: [],
});

describe("getSpeciesDescriptions", () => {
  it("should unwrap the text boxes' hard line breaks and form feeds", () => {
    const species = speciesWithEntries([
      flavorEntry(
        "When several of\nthese POKéMON\ngather, their\felectricity could\nbuild.",
        "red",
      ),
    ]);

    expect(getSpeciesDescriptions(species)).toEqual([
      {
        text: "When several of these POKéMON gather, their electricity could build.",
        versions: ["red"],
      },
    ]);
  });

  it("should close up a word the text box split with a soft hyphen", () => {
    const species = speciesWithEntries([
      flavorEntry("It checks its sur\u00ad\nroundings for light\u00ad\nning.", "gold"),
    ]);

    expect(getSpeciesDescriptions(species)[0].text).toBe(
      "It checks its surroundings for lightning.",
    );
  });

  it("should skip entries in other languages", () => {
    const species = speciesWithEntries([
      flavorEntry("A strange seed.", "red"),
      flavorEntry("Une graine étrange.", "red", "fr"),
    ]);

    expect(getSpeciesDescriptions(species)).toEqual([
      { text: "A strange seed.", versions: ["red"] },
    ]);
  });

  it("should collapse the paired games that ship identical text", () => {
    const species = speciesWithEntries([
      flavorEntry("A strange seed.", "red"),
      flavorEntry("A strange seed.", "blue"),
    ]);

    expect(getSpeciesDescriptions(species)).toEqual([
      { text: "A strange seed.", versions: ["red", "blue"] },
    ]);
  });

  it("should collapse reused text even when the games are generations apart", () => {
    // Charizard really does this: its Sword entry repeats its Diamond one.
    const species = speciesWithEntries([
      flavorEntry("Spits fire hot enough to melt boulders.", "diamond"),
      flavorEntry("Flies in search of powerful opponents.", "black"),
      flavorEntry("Spits fire hot enough to melt boulders.", "sword"),
    ]);

    expect(getSpeciesDescriptions(species)).toEqual([
      { text: "Flies in search of powerful opponents.", versions: ["black"] },
      {
        text: "Spits fire hot enough to melt boulders.",
        versions: ["diamond", "sword"],
      },
    ]);
  });

  it("should place a reused blurb last when its newest game is the newest overall", () => {
    // The anchor is the group's newest game, not its first — which is what keeps
    // the last entry the newest blurb for getLatestDescription to read.
    const species = speciesWithEntries([
      flavorEntry("Old text.", "red"),
      flavorEntry("Newer text.", "gold"),
      flavorEntry("Old text.", "shield"),
    ]);

    expect(getSpeciesDescriptions(species).at(-1)).toEqual({
      text: "Old text.",
      versions: ["red", "shield"],
    });
  });

  it("should drop entries whose text is only whitespace", () => {
    const species = speciesWithEntries([
      flavorEntry("   \n\f  ", "red"),
      flavorEntry("A strange seed.", "blue"),
    ]);

    expect(getSpeciesDescriptions(species)).toEqual([
      { text: "A strange seed.", versions: ["blue"] },
    ]);
  });

  it("should return an empty list for a species with no blurbs", () => {
    expect(getSpeciesDescriptions(speciesWithEntries([]))).toEqual([]);
  });
});

describe("getLatestDescription", () => {
  it("should return the last blurb, which is the newest", () => {
    expect(
      getLatestDescription([
        { text: "Old text.", versions: ["red"] },
        { text: "Newest text.", versions: ["shield"] },
      ]),
    ).toBe("Newest text.");
  });

  it("should return null when the species has no blurbs", () => {
    expect(getLatestDescription([])).toBeNull();
  });
});
