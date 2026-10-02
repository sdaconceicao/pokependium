import { gql } from "@apollo/client";

export const GET_TYPES = gql`
  query GetTypes {
    types {
      name
      count
    }
  }
`;

export const GET_POKEMON_BY_TYPE = gql`
  query GetPokemonByType($type: String!, $limit: Int, $offset: Int, $sort: PokemonSort) {
    pokemonByType(type: $type, limit: $limit, offset: $offset, sort: $sort) {
      total
      offset
      pokemon {
        id
        speciesId
        speciesName
        name
        type
        image
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
      }
    }
  }
`;

export const SEARCH_POKEMON = gql`
  query SearchPokemon($query: String!, $limit: Int, $offset: Int) {
    pokemonSearch(query: $query, limit: $limit, offset: $offset) {
      total
      offset
      pokemon {
        id
        speciesId
        speciesName
        name
        type
        image
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
      }
    }
  }
`;

export const FILTER_POKEMON = gql`
  query FilterPokemon($filter: PokemonFilter!, $limit: Int, $offset: Int, $sort: PokemonSort) {
    pokemonFilter(filter: $filter, limit: $limit, offset: $offset, sort: $sort) {
      total
      offset
      pokemon {
        id
        speciesId
        speciesName
        name
        type
        image
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
      }
    }
  }
`;

export const GET_POKEMON_FORMS = gql`
  query GetPokemonForms($query: String, $limit: Int, $offset: Int, $sort: PokemonSort) {
    pokemonForms(query: $query, limit: $limit, offset: $offset, sort: $sort) {
      total
      offset
      pokemon {
        id
        speciesId
        speciesName
        name
        type
        image
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
      }
    }
  }
`;

export const GET_POKEMON_NAME_SUGGESTIONS = gql`
  query GetPokemonNameSuggestions($query: String!, $limit: Int) {
    pokemonSearch(query: $query, limit: $limit) {
      pokemon {
        id
        speciesId
        speciesName
        name
        image
      }
    }
  }
`;

export const GET_POKEDEXES = gql`
  query GetPokedexes {
    pokedexes {
      name
      displayName
      region
      count
    }
  }
`;

export const GET_POKEMON_BY_POKEDEX = gql`
  query GetPokemonByPokedex($pokedex: String!, $limit: Int, $offset: Int, $sort: PokemonSort) {
    pokemonByPokedex(pokedex: $pokedex, limit: $limit, offset: $offset, sort: $sort) {
      total
      offset
      pokemon {
        id
        speciesId
        speciesName
        name
        type
        image
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
      }
    }
  }
`;

export const GET_REGIONS = gql`
  query GetRegions {
    regions {
      name
      count
    }
  }
`;

export const GET_POKEMON_BY_REGION = gql`
  query GetPokemonByRegion($region: String!, $limit: Int, $offset: Int, $sort: PokemonSort) {
    pokemonByRegion(region: $region, limit: $limit, offset: $offset, sort: $sort) {
      total
      offset
      pokemon {
        id
        speciesId
        speciesName
        name
        type
        image
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
      }
    }
  }
`;

export const GET_POKEMON_BY_IDS = gql`
  query GetPokemonByIds($ids: [ID!]!) {
    pokemonByIds(ids: $ids) {
      id
      speciesId
      speciesName
      name
      type
      image
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
    }
  }
`;
