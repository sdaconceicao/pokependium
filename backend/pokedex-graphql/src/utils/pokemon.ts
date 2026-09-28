import type {
  EvolutionDetail,
  NamedAPIResource,
  PokemonAbility,
  PokemonEntity,
  PokemonIndex,
  PokemonSpecies,
  PokemonStat,
} from "../datasources/pokemon-api.types.js";
import type { AbilityLite, Pokemon, PokemonDescription, Stats } from "../types.js";
import { decimetersToFeet, hectogramsToPounds } from "./conversion.js";

export const FORM_ID_THRESHOLD = 10000;

export const isForm = (entry: PokemonIndex): boolean => entry.number >= FORM_ID_THRESHOLD;

export const isSpecies = (entry: PokemonIndex): boolean => !isForm(entry);

export const getIdFromUrl = (url: string): string => {
  return url.split("/").filter(Boolean).pop() ?? "";
};

// Build a PokemonIndex from a NamedAPIResource, deriving the string id and the
// numeric dex number (used for sorting) from the resource url.
export const toPokemonIndex = (resource: NamedAPIResource): PokemonIndex => {
  const id = getIdFromUrl(resource.url);
  return { id, name: resource.name, number: Number(id) };
};

export const getEvolutionDetail = (details: EvolutionDetail[]) => {
  const detail = details[0];
  return {
    minLevel: detail?.min_level ?? null,
    trigger: detail?.trigger?.name ?? null,
    item: detail?.item?.name ?? null,
  };
};

export const getPokemonAbilitiesLite = (pokemon: PokemonEntity) => {
  return pokemon.abilities.map((ability) => ({
    id: getIdFromUrl(ability.ability.url),
    name: ability.ability.name,
    url: ability.ability.url,
    isHidden: ability.is_hidden,
    slot: ability.slot,
  }));
};

export const getPokemonDefaultImageUrl = (pokemon: PokemonEntity) => {
  let imageUrl = pokemon.sprites.front_default;

  if (!imageUrl) {
    // Try alternative sprites in order of preference
    const fallbackSprites = [
      pokemon.sprites.front_shiny,
      pokemon.sprites.back_default,
      pokemon.sprites.back_shiny,
      pokemon.sprites.other?.["official-artwork"]?.front_default,
      pokemon.sprites.other?.["official-artwork"]?.front_shiny,
      pokemon.sprites.other?.home?.front_default,
      pokemon.sprites.other?.home?.front_shiny,
      pokemon.sprites.other?.dream_world?.front_default,
      pokemon.sprites.other?.showdown?.front_default,
    ];

    imageUrl = fallbackSprites.find((sprite): sprite is string => sprite != null) ?? null;
  }

  // If still no image, use a placeholder or throw an error
  if (!imageUrl) {
    imageUrl = `https://dummyimage.com/96x96/f0f0f0/666666.png&text=${encodeURIComponent(
      pokemon.name,
    )}`;
  }
  return imageUrl;
};

export const getPokemonTypes = (pokemon: PokemonEntity) => {
  return pokemon.types.map((t) => t.type.name);
};

export const getPokemonStats = (pokemon: PokemonEntity) => {
  const statsObj: Stats = {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  };

  pokemon.stats.forEach((stat: PokemonStat) => {
    switch (stat.stat.name) {
      case "hp":
        statsObj.hp = stat.base_stat;
        break;
      case "attack":
        statsObj.attack = stat.base_stat;
        break;
      case "defense":
        statsObj.defense = stat.base_stat;
        break;
      case "special-attack":
        statsObj.specialAttack = stat.base_stat;
        break;
      case "special-defense":
        statsObj.specialDefense = stat.base_stat;
        break;
      case "speed":
        statsObj.speed = stat.base_stat;
        break;
    }
  });
  return statsObj;
};

const normalizeFlavorText = (text: string): string =>
  text
    .replace(/\u00ad\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Every English blurb for a species, deduplicated and oldest first. */
export const getSpeciesDescriptions = (species: PokemonSpecies): PokemonDescription[] => {
  const groups = new Map<string, string[]>();

  for (const entry of species.flavor_text_entries ?? []) {
    if (entry.language.name !== "en") continue;

    const text = normalizeFlavorText(entry.flavor_text);
    if (!text) continue;

    const versions = groups.get(text) ?? [];
    versions.push(entry.version.name);
    groups.delete(text);
    groups.set(text, versions);
  }

  return Array.from(groups, ([text, versions]) => ({ text, versions }));
};

export const getLatestDescription = (descriptions: PokemonDescription[]): string | null =>
  descriptions.at(-1)?.text ?? null;

export const convertAbilityLiteToAbility = (data: PokemonAbility, abilityLite: AbilityLite) => {
  return {
    id: data.id.toString(),
    name: data.name,
    description:
      data.flavor_text_entries.find((entry) => entry.language.name === "en")?.flavor_text || "",
    effect: data.effect_entries.find((entry) => entry.language.name === "en")?.effect || "",
    generation: data.generation.name,
    slot: abilityLite.slot,
  };
};

export const convertPokemonEntityToPokemon = (pokemon: PokemonEntity): Pokemon => {
  return {
    id: pokemon.id.toString(),
    speciesId: getIdFromUrl(pokemon.species.url),
    speciesName: pokemon.species.name,
    name: pokemon.name,
    type: getPokemonTypes(pokemon),
    image: getPokemonDefaultImageUrl(pokemon),
    height: decimetersToFeet(pokemon.height),
    weight: hectogramsToPounds(pokemon.weight),
    stats: getPokemonStats(pokemon),
    abilitiesLite: getPokemonAbilitiesLite(pokemon),
  };
};
