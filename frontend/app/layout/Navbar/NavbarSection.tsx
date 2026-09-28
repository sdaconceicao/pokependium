import { Button, Disclosure, DisclosurePanel } from "@code-x/lago";
import { ChevronDown } from "@untitled-ui/icons-react";
import type { ReactNode } from "react";
import styles from "./Navbar.module.css";
import NavbarItem, { type NavItem } from "./NavbarItem";

export interface NavGroup {
  title: string;
  items: NavItem[];
}

interface NavbarSectionProps {
  /** Identifies the section to the DisclosureGroup that owns which one is open */
  id: string;
  title: string;
  items?: NavItem[];
  /** Sub-headed bands of items, for a section too long to read flat. Given
   *  instead of `items`, not alongside it. */
  groups?: NavGroup[];
  icon?: ReactNode;
  /** Options per row — see `NavSection.columns` for why it is per section */
  columns?: 2;
  isCurrent?: boolean;
  onNavigate?: () => void;
}

export default function NavbarSection({
  id,
  title,
  items,
  groups,
  icon,
  columns,
  isCurrent,
  onNavigate,
}: NavbarSectionProps) {
  const sectionId = title.toLowerCase().replace(/\s+/g, "-");
  return (
    <Disclosure id={id} className={styles.section}>
      <Button
        slot="trigger"
        className={styles.sectionHeader}
        aria-current={isCurrent ? "true" : undefined}
      >
        <span className={styles.sectionHeaderLeft}>
          {icon && (
            <span className={styles.sectionIcon} aria-hidden="true">
              {icon}
            </span>
          )}
          <span className={styles.sectionTitle}>{title}</span>
        </span>
        <ChevronDown className={styles.chevron} aria-hidden="true" />
      </Button>
      <DisclosurePanel>
        {/* A sub-heading per band rather than another Disclosure, for the same
            reason NavbarGroup isn't one: a second chevron inside this one would
            give the same content two competing toggles. */}
        {groups
          ? groups.map((group) => {
              const groupId = `navbar-${sectionId}-${group.title
                .toLowerCase()
                .replace(/\s+/g, "-")}`;

              return (
                <div key={group.title} className={styles.subGroup}>
                  <h3 id={groupId} className={styles.subGroupTitle}>
                    {group.title}
                  </h3>
                  <ul className={styles.list} data-columns={columns} aria-labelledby={groupId}>
                    {group.items.map((item) => (
                      <li key={item.href} className={styles.listItem}>
                        <NavbarItem item={item} onNavigate={onNavigate} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          : items && (
              <ul className={styles.list} data-columns={columns}>
                {items.map((item) => (
                  <li key={item.href} className={styles.listItem}>
                    <NavbarItem item={item} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            )}
      </DisclosurePanel>
    </Disclosure>
  );
}
