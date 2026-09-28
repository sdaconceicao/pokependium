import { GraphQLResolveInfo } from 'graphql';
import { DataSourceContext } from './context.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Ability = {
  __typename?: 'Ability';
  description: Scalars['String']['output'];
  effect: Scalars['String']['output'];
  generation: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slot: Scalars['Int']['output'];
};

export type AbilityLite = {
  __typename?: 'AbilityLite';
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
  __typename?: 'DefensiveMatchup';
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
  __typename?: 'EvolutionChain';
  chain: EvolutionNode;
  id: Scalars['ID']['output'];
};

export type EvolutionNode = {
  __typename?: 'EvolutionNode';
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
  __typename?: 'PokedexDetail';
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
  __typename?: 'Pokemon';
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
  __typename?: 'PokemonDescription';
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
  __typename?: 'PokemonForm';
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  isDefault: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
};

/** Results are ordered by the query's `sort`, national dex number by default. */
export type PokemonList = {
  __typename?: 'PokemonList';
  offset: Scalars['Int']['output'];
  pokemon: Array<Pokemon>;
  total: Scalars['Int']['output'];
};

/** How a Pokemon fares in battle, given its one or two types. */
export type PokemonMatchups = {
  __typename?: 'PokemonMatchups';
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
  __typename?: 'PokemonPokedex';
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
  __typename?: 'PokemonRegion';
  count: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

/**
 * How a list is ordered. `ID_*` is by national dex number, `NAME_*` alphabetical by
 * the name the API spells — which is what the cards display.
 */
export enum PokemonSort {
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  NameAsc = 'NAME_ASC',
  NameDesc = 'NAME_DESC'
}

export type PokemonType = {
  __typename?: 'PokemonType';
  count: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
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
  __typename?: 'RegionDetail';
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
  __typename?: 'Stats';
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
  __typename?: 'TypeDamageRelations';
  doubleDamageFrom: Array<Scalars['String']['output']>;
  doubleDamageTo: Array<Scalars['String']['output']>;
  halfDamageFrom: Array<Scalars['String']['output']>;
  halfDamageTo: Array<Scalars['String']['output']>;
  noDamageFrom: Array<Scalars['String']['output']>;
  noDamageTo: Array<Scalars['String']['output']>;
};

export type TypeDetail = {
  __typename?: 'TypeDetail';
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
  __typename?: 'TypeOffense';
  noEffect: Array<Scalars['String']['output']>;
  notVeryEffective: Array<Scalars['String']['output']>;
  superEffective: Array<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Ability: ResolverTypeWrapper<Ability>;
  AbilityLite: ResolverTypeWrapper<AbilityLite>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  DefensiveMatchup: ResolverTypeWrapper<DefensiveMatchup>;
  DualTypeFilter: DualTypeFilter;
  EvolutionChain: ResolverTypeWrapper<EvolutionChain>;
  EvolutionNode: ResolverTypeWrapper<EvolutionNode>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  PokedexDetail: ResolverTypeWrapper<PokedexDetail>;
  Pokemon: ResolverTypeWrapper<Pokemon>;
  PokemonDescription: ResolverTypeWrapper<PokemonDescription>;
  PokemonFilter: PokemonFilter;
  PokemonForm: ResolverTypeWrapper<PokemonForm>;
  PokemonList: ResolverTypeWrapper<PokemonList>;
  PokemonMatchups: ResolverTypeWrapper<PokemonMatchups>;
  PokemonPokedex: ResolverTypeWrapper<PokemonPokedex>;
  PokemonRegion: ResolverTypeWrapper<PokemonRegion>;
  PokemonSort: PokemonSort;
  PokemonType: ResolverTypeWrapper<PokemonType>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RegionDetail: ResolverTypeWrapper<RegionDetail>;
  Stats: ResolverTypeWrapper<Stats>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  TypeDamageRelations: ResolverTypeWrapper<TypeDamageRelations>;
  TypeDetail: ResolverTypeWrapper<TypeDetail>;
  TypeOffense: ResolverTypeWrapper<TypeOffense>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Ability: Ability;
  AbilityLite: AbilityLite;
  Boolean: Scalars['Boolean']['output'];
  DefensiveMatchup: DefensiveMatchup;
  DualTypeFilter: DualTypeFilter;
  EvolutionChain: EvolutionChain;
  EvolutionNode: EvolutionNode;
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  PokedexDetail: PokedexDetail;
  Pokemon: Pokemon;
  PokemonDescription: PokemonDescription;
  PokemonFilter: PokemonFilter;
  PokemonForm: PokemonForm;
  PokemonList: PokemonList;
  PokemonMatchups: PokemonMatchups;
  PokemonPokedex: PokemonPokedex;
  PokemonRegion: PokemonRegion;
  PokemonType: PokemonType;
  Query: Record<PropertyKey, never>;
  RegionDetail: RegionDetail;
  Stats: Stats;
  String: Scalars['String']['output'];
  TypeDamageRelations: TypeDamageRelations;
  TypeDetail: TypeDetail;
  TypeOffense: TypeOffense;
};

export type AbilityResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Ability'] = ResolversParentTypes['Ability']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  effect?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  generation?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slot?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type AbilityLiteResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['AbilityLite'] = ResolversParentTypes['AbilityLite']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isHidden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slot?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type DefensiveMatchupResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['DefensiveMatchup'] = ResolversParentTypes['DefensiveMatchup']> = {
  multiplier?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type EvolutionChainResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['EvolutionChain'] = ResolversParentTypes['EvolutionChain']> = {
  chain?: Resolver<ResolversTypes['EvolutionNode'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type EvolutionNodeResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['EvolutionNode'] = ResolversParentTypes['EvolutionNode']> = {
  evolvesTo?: Resolver<Array<ResolversTypes['EvolutionNode']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  item?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  minLevel?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  trigger?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PokedexDetailResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['PokedexDetail'] = ResolversParentTypes['PokedexDetail']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isMainSeries?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pokemonCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  region?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  versionGroups?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PokemonResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Pokemon'] = ResolversParentTypes['Pokemon']> = {
  abilities?: Resolver<Maybe<Array<ResolversTypes['Ability']>>, ParentType, ContextType>;
  abilitiesLite?: Resolver<Array<ResolversTypes['AbilityLite']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptions?: Resolver<Maybe<Array<ResolversTypes['PokemonDescription']>>, ParentType, ContextType>;
  evolution?: Resolver<Maybe<ResolversTypes['EvolutionChain']>, ParentType, ContextType>;
  forms?: Resolver<Maybe<Array<ResolversTypes['PokemonForm']>>, ParentType, ContextType>;
  height?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  matchups?: Resolver<Maybe<ResolversTypes['PokemonMatchups']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  speciesId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  speciesName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stats?: Resolver<ResolversTypes['Stats'], ParentType, ContextType>;
  type?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  weight?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type PokemonDescriptionResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['PokemonDescription'] = ResolversParentTypes['PokemonDescription']> = {
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  versions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PokemonFormResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['PokemonForm'] = ResolversParentTypes['PokemonForm']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isDefault?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type PokemonListResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['PokemonList'] = ResolversParentTypes['PokemonList']> = {
  offset?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pokemon?: Resolver<Array<ResolversTypes['Pokemon']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type PokemonMatchupsResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['PokemonMatchups'] = ResolversParentTypes['PokemonMatchups']> = {
  attacking?: Resolver<Array<ResolversTypes['TypeOffense']>, ParentType, ContextType>;
  defending?: Resolver<Array<ResolversTypes['DefensiveMatchup']>, ParentType, ContextType>;
};

export type PokemonPokedexResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['PokemonPokedex'] = ResolversParentTypes['PokemonPokedex']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  region?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PokemonRegionResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['PokemonRegion'] = ResolversParentTypes['PokemonRegion']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type PokemonTypeResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['PokemonType'] = ResolversParentTypes['PokemonType']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type QueryResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  ability?: Resolver<Maybe<ResolversTypes['Ability']>, ParentType, ContextType, RequireFields<QueryAbilityArgs, 'id'>>;
  pokedex?: Resolver<Maybe<ResolversTypes['PokedexDetail']>, ParentType, ContextType, RequireFields<QueryPokedexArgs, 'name'>>;
  pokedexes?: Resolver<Array<ResolversTypes['PokemonPokedex']>, ParentType, ContextType>;
  pokemon?: Resolver<Maybe<ResolversTypes['Pokemon']>, ParentType, ContextType, RequireFields<QueryPokemonArgs, 'id'>>;
  pokemonByIds?: Resolver<Array<ResolversTypes['Pokemon']>, ParentType, ContextType, RequireFields<QueryPokemonByIdsArgs, 'ids'>>;
  pokemonByPokedex?: Resolver<Maybe<ResolversTypes['PokemonList']>, ParentType, ContextType, RequireFields<QueryPokemonByPokedexArgs, 'sort'>>;
  pokemonByRegion?: Resolver<Maybe<ResolversTypes['PokemonList']>, ParentType, ContextType, RequireFields<QueryPokemonByRegionArgs, 'sort'>>;
  pokemonByType?: Resolver<Maybe<ResolversTypes['PokemonList']>, ParentType, ContextType, RequireFields<QueryPokemonByTypeArgs, 'sort'>>;
  pokemonFilter?: Resolver<Maybe<ResolversTypes['PokemonList']>, ParentType, ContextType, RequireFields<QueryPokemonFilterArgs, 'filter' | 'sort'>>;
  pokemonForms?: Resolver<Maybe<ResolversTypes['PokemonList']>, ParentType, ContextType, RequireFields<QueryPokemonFormsArgs, 'sort'>>;
  pokemonSearch?: Resolver<Maybe<ResolversTypes['PokemonList']>, ParentType, ContextType, RequireFields<QueryPokemonSearchArgs, 'query' | 'sort'>>;
  region?: Resolver<Maybe<ResolversTypes['RegionDetail']>, ParentType, ContextType, RequireFields<QueryRegionArgs, 'name'>>;
  regions?: Resolver<Array<ResolversTypes['PokemonRegion']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['TypeDetail']>, ParentType, ContextType, RequireFields<QueryTypeArgs, 'name'>>;
  types?: Resolver<Array<ResolversTypes['PokemonType']>, ParentType, ContextType>;
};

export type RegionDetailResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['RegionDetail'] = ResolversParentTypes['RegionDetail']> = {
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  generation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  locations?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pokedexes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  pokemonCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  versionGroups?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type StatsResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Stats'] = ResolversParentTypes['Stats']> = {
  attack?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  defense?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  hp?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  specialAttack?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  specialDefense?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  speed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type TypeDamageRelationsResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['TypeDamageRelations'] = ResolversParentTypes['TypeDamageRelations']> = {
  doubleDamageFrom?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  doubleDamageTo?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  halfDamageFrom?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  halfDamageTo?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  noDamageFrom?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  noDamageTo?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type TypeDetailResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['TypeDetail'] = ResolversParentTypes['TypeDetail']> = {
  damageRelations?: Resolver<ResolversTypes['TypeDamageRelations'], ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  generation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  moveCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pokemonCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sprite?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type TypeOffenseResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['TypeOffense'] = ResolversParentTypes['TypeOffense']> = {
  noEffect?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  notVeryEffective?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  superEffective?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type Resolvers<ContextType = DataSourceContext> = {
  Ability?: AbilityResolvers<ContextType>;
  AbilityLite?: AbilityLiteResolvers<ContextType>;
  DefensiveMatchup?: DefensiveMatchupResolvers<ContextType>;
  EvolutionChain?: EvolutionChainResolvers<ContextType>;
  EvolutionNode?: EvolutionNodeResolvers<ContextType>;
  PokedexDetail?: PokedexDetailResolvers<ContextType>;
  Pokemon?: PokemonResolvers<ContextType>;
  PokemonDescription?: PokemonDescriptionResolvers<ContextType>;
  PokemonForm?: PokemonFormResolvers<ContextType>;
  PokemonList?: PokemonListResolvers<ContextType>;
  PokemonMatchups?: PokemonMatchupsResolvers<ContextType>;
  PokemonPokedex?: PokemonPokedexResolvers<ContextType>;
  PokemonRegion?: PokemonRegionResolvers<ContextType>;
  PokemonType?: PokemonTypeResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RegionDetail?: RegionDetailResolvers<ContextType>;
  Stats?: StatsResolvers<ContextType>;
  TypeDamageRelations?: TypeDamageRelationsResolvers<ContextType>;
  TypeDetail?: TypeDetailResolvers<ContextType>;
  TypeOffense?: TypeOffenseResolvers<ContextType>;
};

