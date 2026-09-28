// Generated from schema.graphql by scripts/embed-schema.mjs — do not edit.
export const typeDefs = /* GraphQL */ `
type Query {
  pokemon(id: ID!): Pokemon
  pokemonByIds(ids: [ID!]!): [Pokemon!]!
  pokemonSearch(query: String!, limit: Int, offset: Int, sort: PokemonSort = ID_ASC): PokemonList
  pokemonForms(query: String, limit: Int, offset: Int, sort: PokemonSort = ID_ASC): PokemonList
  pokemonByType(type: String, limit: Int, offset: Int, sort: PokemonSort = ID_ASC): PokemonList
  pokemonByPokedex(
    pokedex: String
    limit: Int
    offset: Int
    sort: PokemonSort = ID_ASC
  ): PokemonList
  pokemonByRegion(region: String, limit: Int, offset: Int, sort: PokemonSort = ID_ASC): PokemonList
  pokemonFilter(
    filter: PokemonFilter!
    limit: Int
    offset: Int
    sort: PokemonSort = ID_ASC
  ): PokemonList
  ability(id: ID!): Ability
  types: [PokemonType!]!
  pokedexes: [PokemonPokedex!]!
  regions: [PokemonRegion!]!
  region(name: String!): RegionDetail
  type(name: String!): TypeDetail
  pokedex(name: String!): PokedexDetail
}

"""
How a list is ordered. \`ID_*\` is by national dex number, \`NAME_*\` alphabetical by
the name the API spells — which is what the cards display.
"""
enum PokemonSort {
  ID_ASC
  ID_DESC
  NAME_ASC
  NAME_DESC
}

"""
A pair of types that must BOTH be present. Requires two types by construction,
and matching ignores slot order — \`fire\` + \`flying\` and \`flying\` + \`fire\` select
the same Pokemon.
"""
input DualTypeFilter {
  primary: String!
  secondary: String!
}

"""
Every facet is OR internally and AND against the others. The one exception is
\`dualType\`, which is AND internally and is then OR'd into the type facet:

    (types ANY  OR  dualType BOTH)  AND  pokedexes ANY  AND  regions ANY  AND  query

So \`types: [fire, grass, ground]\` with \`dualType: {fire, flying}\` matches anything
that is fire, grass or ground, plus anything that is a fire/flying dual — and then
narrows that to the given pokedexes and regions.

Omitted facets are skipped rather than matching nothing; a filter with no facets
at all returns the full dex.
"""
input PokemonFilter {
  """
  Case-insensitive substring match on the Pokemon name.
  """
  query: String
  types: [String!]
  dualType: DualTypeFilter
  pokedexes: [String!]
  regions: [String!]
}

"""
Results are ordered by the query's \`sort\`, national dex number by default.
"""
type PokemonList {
  total: Int!
  offset: Int!
  pokemon: [Pokemon!]!
}

type Pokemon {
  id: ID!
  speciesId: ID!
  speciesName: String!
  name: String!
  type: [String!]!
  image: String!
  height: Float!
  weight: Float!
  stats: Stats!
  abilitiesLite: [AbilityLite!]!
  abilities: [Ability!]
  description: String
  descriptions: [PokemonDescription!]
  evolution: EvolutionChain
  forms: [PokemonForm!]
  matchups: PokemonMatchups
}

type PokemonDescription {
  versions: [String!]!
  text: String!
}

type PokemonForm {
  id: ID!
  name: String!
  image: String!
  isDefault: Boolean!
}

type EvolutionChain {
  id: ID!
  chain: EvolutionNode!
}

type EvolutionNode {
  id: ID!
  name: String!
  image: String!
  minLevel: Int
  trigger: String
  item: String
  evolvesTo: [EvolutionNode!]!
}

type Stats {
  hp: Int!
  attack: Int!
  defense: Int!
  specialAttack: Int!
  specialDefense: Int!
  speed: Int!
}

type AbilityLite {
  id: ID!
  name: String!
  url: String!
  slot: Int!
  isHidden: Boolean!
}

type Ability {
  id: ID!
  name: String!
  description: String!
  effect: String!
  generation: String!
  slot: Int!
}

type PokemonRegion {
  name: String!
  count: Int!
}

type RegionDetail {
  id: ID!
  name: String!
  displayName: String!
  generation: String
  pokemonCount: Int!
  locations: [String!]!
  pokedexes: [String!]!
  versionGroups: [String!]!
}

type PokemonPokedex {
  name: String!
  """
  The same name the dex's own page shows, so a nav label and its page agree.
  """
  displayName: String!
  """
  The region this dex covers, for grouping the list. Null for the dexes that
  belong to no single region.
  """
  region: String
  count: Int!
}

"""
One dex as PokeAPI ships it: the list a set of games shipped with, which is why a
dex belongs to version groups rather than to a generation.
"""
type PokedexDetail {
  id: ID!
  name: String!
  displayName: String!
  """
  The English blurb, when PokeAPI has one for this dex.
  """
  description: String
  """
  The region this dex covers, as a slug. Null for the national dex and the
  spin-off dexes, which aren't tied to one.
  """
  region: String
  pokemonCount: Int!
  versionGroups: [String!]!
  """
  False for the spin-off dexes (Conquest, Let's Go's own listings, and so on).
  """
  isMainSeries: Boolean!
}

type PokemonType {
  name: String!
  count: Int!
}

type TypeDetail {
  id: ID!
  name: String!
  displayName: String!
  generation: String
  """
  The type's own icon, newest generation first.
  """
  sprite: String
  pokemonCount: Int!
  moveCount: Int!
  damageRelations: TypeDamageRelations!
}

"""
How this type fares in battle, as type names. The \`*To\` fields are what its own
attacks do; the \`*From\` fields are what it takes.
"""
type TypeDamageRelations {
  doubleDamageTo: [String!]!
  halfDamageTo: [String!]!
  noDamageTo: [String!]!
  doubleDamageFrom: [String!]!
  halfDamageFrom: [String!]!
  noDamageFrom: [String!]!
}

"""
How a Pokemon fares in battle, given its one or two types.
"""
type PokemonMatchups {
  """
  Types that come out at exactly 1x are omitted, 
  so an absent type is neutral rather than unknown.
  """
  defending: [DefensiveMatchup!]!
  """
  Deliberately not combined, each type attacks on its own, so a dual type gets two independent 
  readings and a 2x from one type is not multiplied by a 2x from the other.
  """
  attacking: [TypeOffense!]!
}

"""
One defensive reading. \`multiplier\` is 0, 0.25, 0.5, 2 or 4 — never 1, which is
omitted from \`defending\` entirely.
"""
type DefensiveMatchup {
  type: String!
  multiplier: Float!
}

"""
What one of the Pokemon's types deals to the eighteen. Types absent from all
three lists take normal damage.
"""
type TypeOffense {
  type: String!
  superEffective: [String!]!
  notVeryEffective: [String!]!
  noEffect: [String!]!
}
`;
