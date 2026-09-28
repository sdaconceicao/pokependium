import type { PokemonAbility, PokemonEntity } from "../datasources/pokemon-api.types";

export const createPokemonEntity = (entity: Record<string, unknown>): PokemonEntity =>
  entity as PokemonEntity;

export const createPokemonAbility = (entity: Record<string, unknown>): PokemonAbility =>
  entity as PokemonAbility;
