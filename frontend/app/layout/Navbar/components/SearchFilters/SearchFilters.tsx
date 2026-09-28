"use client";

import {
  Button,
  MultiSelect,
  MultiSelectItem,
  SearchFieldWithSuggestions,
  Select,
  SelectItem,
} from "@code-x/lago";
import { useCallback, useMemo } from "react";
import { buildDualTypeOptions } from "@/lib/searchFilters";
import { titleCase } from "@/lib/string";
import type { PokemonPokedex, PokemonRegion, PokemonType } from "@/types";
import { useSearchFilterForm } from "./SearchFilters.hooks";
import styles from "./SearchFilters.module.css";

interface FacetOption {
  id: string;
  label: string;
}

interface SearchFiltersProps {
  types: PokemonType[];
  regions: PokemonRegion[];
  pokedexes: PokemonPokedex[];
  onNavigate?: () => void;
}

const toOptions = (facets: { name: string }[]): FacetOption[] =>
  facets.map(({ name }) => ({ id: name, label: titleCase(name) }));

/**
 * The faceted search at the top of the sidebar. Every field is optional, and
 * nothing runs until Search is pressed — picking five types shouldn't cost five
 * navigations.
 *
 * The option lists are the same ones the Browse sections below are built from,
 * fetched once per request by `NavigationDataProvider` and handed down, so the
 * form costs no extra request.
 */
export default function SearchFilters({
  types,
  regions,
  pokedexes,
  onNavigate,
}: SearchFiltersProps) {
  const {
    draft,
    dualTypeKey,
    setTypes,
    setRegions,
    setPokedexes,
    setDualTypeKey,
    setName,
    loadSuggestions,
    submit,
    clear,
  } = useSearchFilterForm();

  const handleSubmit = useCallback(() => {
    submit();
    onNavigate?.();
  }, [submit, onNavigate]);

  const typeOptions = useMemo(() => toOptions(types), [types]);
  const regionOptions = useMemo(() => toOptions(regions), [regions]);
  const pokedexOptions = useMemo(() => toOptions(pokedexes), [pokedexes]);
  // Around 150 pairs for a full dex, so it is built once rather than per render.
  const dualTypeOptions = useMemo(() => buildDualTypeOptions(types), [types]);

  return (
    // Deliberately not a <form>: the name field owns Enter for its own
    // suggestion dropdown, and a native submit would race it. Search is a plain
    // button, and the field's onSubmit calls the same handler.
    <search className={styles.filters} aria-label="Filter Pokemon">
      <p className={styles.hint}>
        More choices in one field widen the results; filling in more fields narrows them.
      </p>

      {/* `defaultItems`, not `items`, on every field below: react-aria reads a
          controlled `items` collection as "the caller is doing the filtering"
          and renders it verbatim, so typing would narrow nothing. These lists
          are fixed for the session, so letting the field own the filtering is
          both the documented usage and the behavior we want. */}
      <MultiSelect<FacetOption>
        label="Types"
        size="sm"
        placeholder="Any type"
        defaultItems={typeOptions}
        value={draft.types}
        onChange={setTypes}
      >
        {(option) => <MultiSelectItem id={option.id}>{option.label}</MultiSelectItem>}
      </MultiSelect>

      <Select<FacetOption>
        label="Dual type"
        size="sm"
        placeholder="Any combination"
        description="Widens the search: also matches Pokemon that are both of these types."
        defaultItems={dualTypeOptions}
        value={dualTypeKey}
        onChange={setDualTypeKey}
      >
        {(option) => <SelectItem id={option.id}>{option.label}</SelectItem>}
      </Select>

      <MultiSelect<FacetOption>
        label="Regions"
        size="sm"
        placeholder="Any region"
        defaultItems={regionOptions}
        value={draft.regions}
        onChange={setRegions}
      >
        {(option) => <MultiSelectItem id={option.id}>{option.label}</MultiSelectItem>}
      </MultiSelect>

      <MultiSelect<FacetOption>
        label="Pokedexes"
        size="sm"
        placeholder="Any pokedex"
        defaultItems={pokedexOptions}
        value={draft.pokedexes}
        onChange={setPokedexes}
      >
        {(option) => <MultiSelectItem id={option.id}>{option.label}</MultiSelectItem>}
      </MultiSelect>

      {/* The suggestions are a shortcut, not a requirement — picking one just
          fills the field, and typing a partial name and searching is equally
          valid, since the facet is a substring match either way. */}
      <SearchFieldWithSuggestions
        label="Name"
        size="sm"
        placeholder="Any name"
        value={draft.q}
        onChange={setName}
        onSubmit={handleSubmit}
        loadSuggestions={loadSuggestions}
        className={styles.nameField}
      />

      <div className={styles.actions}>
        {/* The name field renders lago's own "Search" button inside itself, so
            this one spells out what it does — otherwise the sidebar offers two
            buttons with the same name and no way to tell them apart. */}
        <Button aria-label="Search with these filters" onPress={handleSubmit}>
          Search
        </Button>
        <Button variant="quiet" onPress={clear}>
          Clear
        </Button>
      </div>
    </search>
  );
}
