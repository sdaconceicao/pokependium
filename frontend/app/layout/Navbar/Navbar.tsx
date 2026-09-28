import { useMemo } from "react";
import { DisclosureGroup } from "react-aria-components";
import type { NavigationData } from "@/providers/NavigationDataProvider";
import SearchFilters from "./components/SearchFilters";
import styles from "./Navbar.module.css";
import {
  getPokedexGroups,
  getRegionItems,
  getSpecialItems,
  getTypeItems,
  NAV_SECTIONS,
  type NavSectionKey,
} from "./Navbar.util";
import NavbarGroup from "./NavbarGroup";
import type { NavItem } from "./NavbarItem";
import NavbarSection from "./NavbarSection";

interface NavbarProps {
  navigationData: NavigationData;
  openSection: NavSectionKey | null;
  currentSection: NavSectionKey | null;
  onOpenSectionChange: (key: NavSectionKey | null) => void;
  onNavigate?: () => void;
}

export default function Navbar({
  navigationData,
  openSection,
  currentSection,
  onOpenSectionChange,
  onNavigate,
}: NavbarProps) {
  const { types, pokedexes, regions } = navigationData;

  const typeItems = useMemo(() => getTypeItems(types), [types]);
  const specialItems = useMemo(() => getSpecialItems(), []);
  const regionItems = useMemo(() => getRegionItems(regions), [regions]);
  const pokedexGroups = useMemo(() => getPokedexGroups(pokedexes), [pokedexes]);

  const itemsByKey: Record<Exclude<NavSectionKey, "pokedexes">, NavItem[]> = {
    types: typeItems,
    special: specialItems,
    regions: regionItems,
  };

  return (
    <nav className={styles.navbar}>
      <NavbarGroup title="Search">
        <SearchFilters
          types={types}
          regions={regions}
          pokedexes={pokedexes}
          onNavigate={onNavigate}
        />
      </NavbarGroup>

      <NavbarGroup title="Browse">
        <DisclosureGroup
          expandedKeys={openSection ? [openSection] : []}
          onExpandedChange={(keys) => {
            const key = Array.from(keys)[0];
            onOpenSectionChange((key as NavSectionKey | undefined) ?? null);
          }}
        >
          {NAV_SECTIONS.map(({ key, title, icon, columns }) =>
            key === "pokedexes" ? (
              <NavbarSection
                key={key}
                id={key}
                title={title}
                icon={icon}
                isCurrent={key === currentSection}
                onNavigate={onNavigate}
                groups={pokedexGroups}
              />
            ) : (
              <NavbarSection
                key={key}
                id={key}
                title={title}
                icon={icon}
                isCurrent={key === currentSection}
                onNavigate={onNavigate}
                columns={columns}
                items={itemsByKey[key]}
              />
            ),
          )}
        </DisclosureGroup>
      </NavbarGroup>
    </nav>
  );
}
