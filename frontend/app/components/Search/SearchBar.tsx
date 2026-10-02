"use client";

import { useApolloClient } from "@apollo/client/react";
import { Avatar, SearchFieldWithSuggestions, type SearchSuggestion } from "@code-x/lago";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatPokemonName } from "@/lib/formNames";
import { buildPokemonPath } from "@/lib/pokemonUrls";
import { GET_POKEMON_NAME_SUGGESTIONS } from "@/lib/queries";
import { buildSearchUrl, hasActiveFilters, parseSearchParams } from "@/lib/searchFilters";
import styles from "./SearchBar.module.css";

interface PokemonSuggestion extends SearchSuggestion {
  speciesId: string;
  image: string;
}

interface SuggestionsData {
  pokemonSearch?: {
    pokemon: {
      id: string;
      speciesId: string;
      speciesName: string;
      name: string;
      image: string;
    }[];
  } | null;
}

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useApolloClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize search query from URL params
  useEffect(() => {
    const query = searchParams.get("q") || "";
    setSearchQuery(query);
  }, [searchParams]);

  // The name is one facet of the same filter the sidebar drives, so setting it
  // from here keeps whatever else is already selected rather than replacing it,
  // and only resets the page — the old page number belongs to the old results.
  // With nothing left to filter on there is nothing to show, so that goes home
  // rather than to a results page listing the entire dex.
  const goToResults = useCallback(
    (q: string) => {
      const next = { ...parseSearchParams(searchParams), q, page: 1 };
      router.push(hasActiveFilters(next) ? buildSearchUrl(next) : "/");
    },
    [router, searchParams],
  );

  // lago's SearchField calls onSubmit with the current value directly — no
  // form event to preventDefault, and no need to read the input by ref.
  const handleSubmit = useCallback((value: string) => goToResults(value), [goToResults]);

  // Fired by the field's built-in clear button once it has reset the (locally
  // controlled) value — see onChange below — so this only needs to handle the
  // navigation side effect the old hand-rolled clear button used to do. It
  // clears the name, not the whole filter, so any facets the sidebar set stay.
  const handleClear = useCallback(() => goToResults(""), [goToResults]);

  const loadSuggestions = useCallback(
    async (query: string): Promise<PokemonSuggestion[]> => {
      const trimmed = query.trim();
      if (trimmed.length < 2) return [];

      try {
        const { data } = await client.query<SuggestionsData>({
          query: GET_POKEMON_NAME_SUGGESTIONS,
          variables: { query: trimmed, limit: 8 },
          fetchPolicy: "cache-first",
        });

        return (data?.pokemonSearch?.pokemon ?? []).map((pokemon) => ({
          id: pokemon.id,
          speciesId: pokemon.speciesId,
          label: formatPokemonName(pokemon),
          image: pokemon.image,
        }));
      } catch {
        return [];
      }
    },
    [client],
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      const pokemon = suggestion as PokemonSuggestion;
      router.push(buildPokemonPath(pokemon.speciesId, pokemon.id));
    },
    [router],
  );

  const renderSuggestion = useCallback((suggestion: SearchSuggestion) => {
    const pokemon = suggestion as PokemonSuggestion;
    return (
      <span className={styles.suggestion}>
        <Avatar
          src={pokemon.image}
          alt=""
          name={pokemon.label}
          size="sm"
          shape="square"
          className={styles.suggestionImage}
        />
        <span>{pokemon.label}</span>
      </span>
    );
  }, []);

  return (
    <SearchFieldWithSuggestions
      aria-label="Search Pokemon"
      placeholder="Search Pokemon..."
      value={searchQuery}
      onChange={setSearchQuery}
      onSubmit={handleSubmit}
      onClear={handleClear}
      loadSuggestions={loadSuggestions}
      onSuggestionSelect={handleSuggestionSelect}
      renderSuggestion={renderSuggestion}
      className={styles.searchField}
    />
  );
}
