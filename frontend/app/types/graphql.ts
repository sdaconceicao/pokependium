export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Ability = {
  description: Scalars['String']['output'];
  effect: Scalars['String']['output'];
  generation: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slot: Scalars['Int']['output'];
};

export type AbilityLite = {
  id: Scalars['ID']['output'];
  isHidden: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  slot: Scalars['Int']['output'];
  url: Scalars['String']['output'];
};

/**
 * One defensive reading. `multiplier` is 0, 0.25, 0.5, 2 or 4 — never 1, which is
 * omitted from `defending` entirely.
 */
export type DefensiveMatchup = {
  multiplier: Scalars['Float']['output'];
  type: Scalars['String']['output'];
};

/**
 * A pair of types that must BOTH be present. Requires two types by construction,
 * and matching ignores slot order — `fire` + `flying` and `flying` + `fire` select
 * the same Pokemon.
 */
export type DualTypeFilter = {
  primary: Scalars['String']['input'];
  secondary: Scalars['String']['input'];
};

export type EvolutionChain = {
  chain: EvolutionNode;
  id: Scalars['ID']['output'];
};

export type EvolutionNode = {
  evolvesTo: Array<EvolutionNode>;
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  item?: Maybe<Scalars['String']['output']>;
  minLevel?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  trigger?: Maybe<Scalars['String']['output']>;
};

/**
 * One dex as PokeAPI ships it: the list a set of games shipped with, which is why a
 * dex belongs to version groups rather than to a generation.
 */
export type PokedexDetail = {
  /** The English blurb, when PokeAPI has one for this dex. */
  description?: Maybe<Scalars['String']['output']>;
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** False for the spin-off dexes (Conquest, Let's Go's own listings, and so on). */
  isMainSeries: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  pokemonCount: Scalars['Int']['output'];
  /**
   * The region this dex covers, as a slug. Null for the national dex and the
   * spin-off dexes, which aren't tied to one.
   */
  region?: Maybe<Scalars['String']['output']>;
  versionGroups: Array<Scalars['String']['output']>;
};

export type Pokemon = {
  abilities?: Maybe<Array<Ability>>;
  abilitiesLite: Array<AbilityLite>;
  description?: Maybe<Scalars['String']['output']>;
  descriptions?: Maybe<Array<PokemonDescription>>;
  evolution?: Maybe<EvolutionChain>;
  forms?: Maybe<Array<PokemonForm>>;
  height: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  matchups?: Maybe<PokemonMatchups>;
  name: Scalars['String']['output'];
  speciesId: Scalars['ID']['output'];
  speciesName: Scalars['String']['output'];
  stats: Stats;
  type: Array<Scalars['String']['output']>;
  weight: Scalars['Float']['output'];
};

export type PokemonDescription = {
  text: Scalars['String']['output'];
  versions: Array<Scalars['String']['output']>;
};

/**
 * Every facet is OR internally and AND against the others. The one exception is
 * `dualType`, which is AND internally and is then OR'd into the type facet:
 *
 *     (types ANY  OR  dualType BOTH)  AND  pokedexes ANY  AND  regions ANY  AND  query
 *
 * So `types: [fire, grass, ground]` with `dualType: {fire, flying}` matches anything
 * that is fire, grass or ground, plus anything that is a fire/flying dual — and then
 * narrows that to the given pokedexes and regions.
 *
 * Omitted facets are skipped rather than matching nothing; a filter with no facets
 * at all returns the full dex.
 */
export type PokemonFilter = {
  dualType?: InputMaybe<DualTypeFilter>;
  pokedexes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Case-insensitive substring match on the Pokemon name. */
  query?: InputMaybe<Scalars['String']['input']>;
  regions?: InputMaybe<Array<Scalars['String']['input']>>;
  types?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type PokemonForm = {
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  isDefault: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
};

/** Results are ordered by the query's `sort`, national dex number by default. */
export type PokemonList = {
  offset: Scalars['Int']['output'];
  pokemon: Array<Pokemon>;
  total: Scalars['Int']['output'];
};

/** How a Pokemon fares in battle, given its one or two types. */
export type PokemonMatchups = {
  /**
   * Deliberately not combined, each type attacks on its own, so a dual type gets two independent
   * readings and a 2x from one type is not multiplied by a 2x from the other.
   */
  attacking: Array<TypeOffense>;
  /**
   * Types that come out at exactly 1x are omitted,
   * so an absent type is neutral rather than unknown.
   */
  defending: Array<DefensiveMatchup>;
};

export type PokemonPokedex = {
  count: Scalars['Int']['output'];
  /** The same name the dex's own page shows, so a nav label and its page agree. */
  displayName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  /**
   * The region this dex covers, for grouping the list. Null for the dexes that
   * belong to no single region.
   */
  region?: Maybe<Scalars['String']['output']>;
};

export type PokemonRegion = {
  count: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

/**
 * How a list is ordered. `ID_*` is by national dex number, `NAME_*` alphabetical by
 * the name the API spells — which is what the cards display.
 */
export type PokemonSort =
  | 'ID_ASC'
  | 'ID_DESC'
  | 'NAME_ASC'
  | 'NAME_DESC';

export type PokemonType = {
  count: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type Query = {
  ability?: Maybe<Ability>;
  pokedex?: Maybe<PokedexDetail>;
  pokedexes: Array<PokemonPokedex>;
  pokemon?: Maybe<Pokemon>;
  pokemonByIds: Array<Pokemon>;
  pokemonByPokedex?: Maybe<PokemonList>;
  pokemonByRegion?: Maybe<PokemonList>;
  pokemonByType?: Maybe<PokemonList>;
  pokemonFilter?: Maybe<PokemonList>;
  pokemonForms?: Maybe<PokemonList>;
  pokemonSearch?: Maybe<PokemonList>;
  region?: Maybe<RegionDetail>;
  regions: Array<PokemonRegion>;
  type?: Maybe<TypeDetail>;
  types: Array<PokemonType>;
};


export type QueryAbilityArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPokedexArgs = {
  name: Scalars['String']['input'];
};


export type QueryPokemonArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPokemonByIdsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type QueryPokemonByPokedexArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pokedex?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<PokemonSort>;
};


export type QueryPokemonByRegionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  region?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<PokemonSort>;
};


export type QueryPokemonByTypeArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<PokemonSort>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPokemonFilterArgs = {
  filter: PokemonFilter;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<PokemonSort>;
};


export type QueryPokemonFormsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<PokemonSort>;
};


export type QueryPokemonSearchArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
  sort?: InputMaybe<PokemonSort>;
};


export type QueryRegionArgs = {
  name: Scalars['String']['input'];
};


export type QueryTypeArgs = {
  name: Scalars['String']['input'];
};

export type RegionDetail = {
  displayName: Scalars['String']['output'];
  generation?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  locations: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  pokedexes: Array<Scalars['String']['output']>;
  pokemonCount: Scalars['Int']['output'];
  versionGroups: Array<Scalars['String']['output']>;
};

export type Stats = {
  attack: Scalars['Int']['output'];
  defense: Scalars['Int']['output'];
  hp: Scalars['Int']['output'];
  specialAttack: Scalars['Int']['output'];
  specialDefense: Scalars['Int']['output'];
  speed: Scalars['Int']['output'];
};

/**
 * How this type fares in battle, as type names. The `*To` fields are what its own
 * attacks do; the `*From` fields are what it takes.
 */
export type TypeDamageRelations = {
  doubleDamageFrom: Array<Scalars['String']['output']>;
  doubleDamageTo: Array<Scalars['String']['output']>;
  halfDamageFrom: Array<Scalars['String']['output']>;
  halfDamageTo: Array<Scalars['String']['output']>;
  noDamageFrom: Array<Scalars['String']['output']>;
  noDamageTo: Array<Scalars['String']['output']>;
};

export type TypeDetail = {
  damageRelations: TypeDamageRelations;
  displayName: Scalars['String']['output'];
  generation?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  moveCount: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  pokemonCount: Scalars['Int']['output'];
  /** The type's own icon, newest generation first. */
  sprite?: Maybe<Scalars['String']['output']>;
};

/**
 * What one of the Pokemon's types deals to the eighteen. Types absent from all
 * three lists take normal damage.
 */
export type TypeOffense = {
  noEffect: Array<Scalars['String']['output']>;
  notVeryEffective: Array<Scalars['String']['output']>;
  superEffective: Array<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};
