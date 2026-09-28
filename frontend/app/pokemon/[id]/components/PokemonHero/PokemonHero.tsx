"use client";

import { Heading } from "@code-x/lago";
import clsx from "clsx";
import Image from "next/image";
import BackButton from "@/components/BackButton";
import HeroToolbar from "@/components/HeroToolbar";
import PokemonTypePill from "@/components/PokemonTypePill";
import { useScrolledPast } from "@/hooks";
import { formatFormName, formatPokemonName } from "@/lib/formNames";
import FormSelect from "@/pokemon/[id]/components/FormSelect";
import type { Pokemon } from "@/types";
import styles from "./PokemonHero.module.css";
import { formatHeight, formatWeight, getDexNumber } from "./PokemonHero.utils";

interface PokemonHeroProps {
  pokemon: Pokemon;
  className?: string;
  /** Run the hero out to its container's edges and square off its bottom so it
   *  reads as that container's header rather than a card sitting inside it.
   *  The container has to publish --panel-inset and --panel-radius for this to
   *  have anything to measure against — see Modal's body. */
  flush?: boolean;
}

export const PokemonHero = ({ pokemon, className, flush }: PokemonHeroProps) => {
  const { ref, scrolledPast } = useScrolledPast<HTMLElement>();

  const forms = pokemon.forms ?? [];
  const speciesName = pokemon.speciesName;

  return (
    <>
      {scrolledPast && (
        <HeroToolbar
          className={className}
          flush={flush}
          title={formatPokemonName(pokemon)}
          aside={<BackButton size="sm">Back</BackButton>}
          icon={
            <Image
              src={pokemon.image}
              alt=""
              className={styles.toolbarSprite}
              width={32}
              height={32}
            />
          }
        />
      )}

      <section ref={ref} className={clsx(styles.hero, flush && styles.flush, className)}>
        <div className={styles.heroToolbar}>
          <BackButton>Back</BackButton>
          <div className={styles.heroMeta}>
            <div className={styles.typesContainer}>
              {pokemon.type.map((type: string) => (
                <PokemonTypePill key={type} type={type} className={styles.heroPill} />
              ))}
            </div>
            <span className={styles.pokemonNumber}>{getDexNumber(pokemon.speciesId)}</span>
          </div>
        </div>

        <div className={styles.heroBody}>
          <div className={styles.heroInfo}>
            <Heading level={1} className={styles.pokemonName}>
              {formatFormName(speciesName)}
            </Heading>
            <FormSelect
              forms={forms}
              currentId={pokemon.id}
              speciesId={pokemon.speciesId}
              speciesName={speciesName}
            />
            {pokemon.description && <p className={styles.description}>{pokemon.description}</p>}
            <dl className={styles.physicalStats}>
              <div>
                <dt>Height</dt>
                <dd>{formatHeight(pokemon.height)}</dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>{formatWeight(pokemon.weight)}</dd>
              </div>
            </dl>
          </div>

          <div className={styles.heroImage}>
            <Image
              src={pokemon.image}
              alt={pokemon.name}
              className={styles.pokemonImage}
              width={360}
              height={360}
              priority
            />
          </div>
        </div>
      </section>
    </>
  );
};
