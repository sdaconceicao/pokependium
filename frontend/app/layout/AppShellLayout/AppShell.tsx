"use client";

import { Button, Toolbar } from "@code-x/lago";
import { ChevronLeft, ChevronRight, Menu01, SearchLg, XClose } from "@untitled-ui/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthButtons from "@/components/AuthButtons";
import Logo from "@/components/Logo";
import Pokeball from "@/components/Pokeball";
import { SearchBar } from "@/components/Search";
import Navbar, { getOpenSectionKey, NAV_SECTIONS, type NavSectionKey } from "@/layout/Navbar";
import type { NavigationData } from "@/providers/NavigationDataProvider";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: React.ReactNode;
  navigationData: NavigationData;
}

const MOBILE_BREAKPOINT = 768;

export default function AppShell({ children, navigationData }: AppShellProps) {
  // Two separate things, deliberately not one boolean: how wide the docked
  // sidebar is on desktop, and whether the overlay drawer is showing on
  // mobile. Both default to what the server can safely render — expanded on
  // desktop, closed on mobile — so nothing flips after hydration.
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const routeSection = getOpenSectionKey(usePathname());
  const [openSection, setOpenSection] = useState<NavSectionKey | null>(routeSection);
  const [lastRouteSection, setLastRouteSection] = useState(routeSection);

  // Sync open section when the route crosses into another Browse section.
  if (routeSection !== lastRouteSection) {
    setLastRouteSection(routeSection);
    setOpenSection(routeSection);
  }

  // Track the viewport so the toggle knows which of the two it drives
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      // Growing past the breakpoint shouldn't strand the drawer open
      if (!e.matches) setDrawerOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Close the mobile drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const expanded = isMobile ? drawerOpen : !collapsed;
  const toggle = () => (isMobile ? setDrawerOpen((v) => !v) : setCollapsed((v) => !v));

  return (
    <div className={styles.container}>
      {/* Mobile-only backdrop — the class is display:none above the breakpoint */}
      {drawerOpen && (
        <div className={styles.backdrop} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}

      {/* ── Sidebar: full height, carries the brand ─── */}
      <aside
        id="app-sidebar"
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${
          drawerOpen ? styles.drawerOpen : ""
        }`}
        inert={isMobile && !drawerOpen}
      >
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink} aria-label="Poképendium home">
            <Logo className={styles.brandLogo} />
            <Pokeball size={28} className={styles.brandMark} />
          </Link>
          {/* "Menu" rather than "Browse": the drawer now opens onto the search
              form as well, and Browse is one of the two headings inside it. */}
          <span className={styles.drawerTitle}>Menu</span>
          {/* The drawer covers the header toggle while open, so it needs its
              own dismiss. Hidden on desktop, where the toggle stays reachable.
              Its 18px comes from `--button-icon-size` in the stylesheet — lago
              0.6.0 made that a public input, so the icon no longer needs a
              wrapper element to escape the default. */}
          <Button
            variant="quiet"
            className={styles.drawerClose}
            onPress={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <XClose aria-hidden="true" />
          </Button>
        </div>

        <div className={styles.sidebarBody}>
          <div className={styles.sidebarNav}>
            <Suspense fallback={null}>
              <Navbar
                navigationData={navigationData}
                openSection={openSection}
                currentSection={routeSection}
                onOpenSectionChange={setOpenSection}
                onNavigate={() => setDrawerOpen(false)}
              />
            </Suspense>
          </div>

          {/* Collapsed rail — icons stand in for the sections. A Toolbar
              rather than a plain div: it's a set of same-purpose icon
              buttons, so roving-tabindex arrow-key navigation between them
              is exactly what lago's Toolbar is for. */}
          <Toolbar
            orientation="vertical"
            aria-label="Expand sidebar sections"
            className={styles.rail}
          >
            {/* The search form has no NAV_SECTIONS entry — it isn't a list of
                links — so its rail button is spelled out here, first, matching
                the order inside the sidebar. */}
            <Button
              variant="quiet"
              className={styles.railButton}
              onPress={() => setCollapsed(false)}
              aria-label="Expand sidebar to search"
            >
              <span title="Search" aria-hidden="true">
                <SearchLg width={18} height={18} />
              </span>
            </Button>

            {NAV_SECTIONS.map(({ key, title, icon }) => (
              <Button
                key={key}
                variant="quiet"
                className={styles.railButton}
                onPress={() => {
                  setOpenSection(key);
                  setCollapsed(false);
                }}
                aria-current={key === routeSection ? "true" : undefined}
                aria-label={`Expand sidebar to browse ${title}`}
              >
                {/* The hover tooltip hangs off the span rather than the Button:
                    lago's ButtonProps models react-aria's surface, which has no
                    `title`. That is the only reason left for the wrapper — and
                    lago flexes it, so the glyph still centres. */}
                <span title={title} aria-hidden="true">
                  {icon}
                </span>
              </Button>
            ))}
          </Toolbar>
        </div>
      </aside>

      {/* ── Content column: header + page ───────────── */}
      <div className={styles.contentColumn}>
        <header className={styles.header}>
          {/* The one place the sidebar is opened and closed, at every size.
              Both icons render and CSS picks one, so neither the glyph nor the
              position depends on JS resolving the viewport first. Sizing is
              `--button-icon-size` per breakpoint, so the two glyphs can differ
              without a wrapper — see `.drawerClose` above. */}
          <Button
            variant="quiet"
            className={styles.sidebarToggle}
            onPress={toggle}
            aria-label={expanded ? "Hide navigation" : "Show navigation"}
            aria-expanded={expanded}
            aria-controls="app-sidebar"
          >
            <Menu01 className={styles.toggleIconMobile} aria-hidden="true" />
            {collapsed ? (
              <ChevronRight className={styles.toggleIconDesktop} aria-hidden="true" />
            ) : (
              <ChevronLeft className={styles.toggleIconDesktop} aria-hidden="true" />
            )}
          </Button>

          {/* Mobile only — on desktop the brand lives in the sidebar */}
          <Link href="/" className={styles.headerLogo} aria-label="Poképendium home">
            <Logo />
          </Link>

          <div className={styles.headerSearch}>
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>

          <div className={styles.headerRight}>
            <Suspense fallback={null}>
              <AuthButtons />
            </Suspense>
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
