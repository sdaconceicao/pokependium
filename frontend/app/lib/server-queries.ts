import { gql } from "@apollo/client";
import type { PokedexDetail, Pokemon, RegionDetail, TypeDetail } from "../types";
import { client } from "./apollo-client";

const GET_POKEMON_BY_ID = gql`
  query GetPokemonById($id: ID!) {
    pokemon(id: $id) {
      id
      speciesId
      speciesName
      name
      type
      image
      height
      weight
      description
      stats {
        hp
        attack
        defense
        specialAttack
        specialDefense
        speed
      }
      abilitiesLite {
        id
        name
        url
        slot
        isHidden
      }
      matchups {
        defending {
          type
          multiplier
        }
        attacking {
          type
          superEffective
          notVeryEffective
          noEffect
        }
      }
      abilities {
        id
        name
        description
        effect
        generation
        slot
      }
      evolution {
        id
        chain {
          id
          name
          image
          minLevel
          trigger
          item
          evolvesTo {
            id
            name
            image
            minLevel
            trigger
            item
            evolvesTo {
              id
              name
              image
              minLevel
              trigger
              item
            }
          }
        }
      }
      forms {
        id
        name
        image
        isDefault
      }
    }
  }
`;

const GET_REGION = gql`
  query GetRegion($name: String!) {
    region(name: $name) {
      id
      name
      displayName
      generation
      pokemonCount
      locations
      pokedexes
      versionGroups
    }
  }
`;

const GET_TYPE = gql`
  query GetType($name: String!) {
    type(name: $name) {
      id
      name
      displayName
      generation
      sprite
      pokemonCount
      moveCount
      damageRelations {
        doubleDamageTo
        halfDamageTo
        noDamageTo
        doubleDamageFrom
        halfDamageFrom
        noDamageFrom
      }
    }
  }
`;

const GET_POKEDEX = gql`
  query GetPokedex($name: String!) {
    pokedex(name: $name) {
      id
      name
      displayName
      description
      region
      pokemonCount
      versionGroups
      isMainSeries
    }
  }
`;

export async function getPokemonById(id: string): Promise<Pokemon> {
  try {
    console.log("Attempting to fetch Pokemon with ID:", id);

    const { data, error } = await client.query<{ pokemon: Pokemon }>({
      query: GET_POKEMON_BY_ID,
      variables: { id },
    });

    if (error) {
      console.error("GraphQL error:", error);
      throw error;
    }

    if (!data?.pokemon) {
      throw new Error(`Pokemon with ID ${id} not found`);
    }

    return data.pokemon;
  } catch (error) {
    console.error("Failed to fetch Pokemon:", error);
    throw error;
  }
}

export async function getRegionByName(name: string): Promise<RegionDetail | null> {
  try {
    const { data } = await client.query<{ region: RegionDetail | null }>({
      query: GET_REGION,
      variables: { name },
    });

    return data?.region ?? null;
  } catch (error) {
    console.error(`Failed to fetch region ${name}:`, error);
    return null;
  }
}

export async function getTypeByName(name: string): Promise<TypeDetail | null> {
  try {
    const { data } = await client.query<{ type: TypeDetail | null }>({
      query: GET_TYPE,
      variables: { name },
    });

    return data?.type ?? null;
  } catch (error) {
    console.error(`Failed to fetch type ${name}:`, error);
    return null;
  }
}

export async function getPokedexByName(name: string): Promise<PokedexDetail | null> {
  try {
    const { data } = await client.query<{ pokedex: PokedexDetail | null }>({
      query: GET_POKEDEX,
      variables: { name },
    });

    return data?.pokedex ?? null;
  } catch (error) {
    console.error(`Failed to fetch pokedex ${name}:`, error);
    return null;
  }
}
