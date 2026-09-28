"use client";

import { Link } from "@code-x/lago";
import NextLink from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { paramIncludes } from "./Navbar.util";
import styles from "./NavbarItem.module.css";

export interface NavItem {
  label: string;
  href: string;
  /** For items that are one facet of the shared `/search` results rather than a
   *  page of their own. Membership, not equality: several of these can be
   *  selected at once and they share a single comma-joined param. */
  activeWhenSearchParamIncludes?: {
    key: string;
    value: string;
  };
  /** For items that navigate to a page of their own */
  activeWhenPathnameEquals?: string;
  /** For an item that stands for several pages — a dex family's revisions all
   *  light up the one item that opens them. */
  activeWhenPathnameIn?: string[];
  icon?: ReactNode;
}

interface NavbarItemProps {
  item: NavItem;
  onNavigate?: () => void;
}

export default function NavbarItem({ item, onNavigate }: NavbarItemProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // The param check is scoped to the item's own route, taken from its href, so
  // an item can't light up on some other page that happens to use the same
  // param name.
  const isActive = item.activeWhenPathnameIn
    ? item.activeWhenPathnameIn.includes(pathname)
    : item.activeWhenPathnameEquals
      ? pathname === item.activeWhenPathnameEquals
      : item.activeWhenSearchParamIncludes
        ? pathname === item.href.split("?")[0] &&
          paramIncludes(
            searchParams.get(item.activeWhenSearchParamIncludes.key),
            item.activeWhenSearchParamIncludes.value,
          )
        : false;

  return (
    // lago's Link supplies the interaction/state contract (hover, focus-visible
    // and, via `aria-current` below, a `data-current` hook for styling) while
    // delegating the actual anchor to Next's own Link through `render`, so
    // clicks still get Next's client-side transition *and* prefetching — a
    // plain `href` on lago's Link would navigate through the app router too
    // (see LagoProvider's RouterProvider), but without Next's prefetch.
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={styles.navItem}
      onPress={onNavigate}
      render={(props) => (
        // lago types `render`'s props as anchor-or-span, because Link drops to
        // a <span> when it has no href. This one always has one, so the anchor
        // branch is the only reachable case and the narrowing is sound.
        <NextLink {...(props as ComponentPropsWithoutRef<"a">)} href={item.href}>
          {item.label} {item.icon}
        </NextLink>
      )}
    />
  );
}
