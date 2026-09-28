"use client";

import {
  Avatar,
  Button,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  Separator,
  SlottedText,
} from "@code-x/lago";
import { Bookmark, LogOut01, User01 } from "@untitled-ui/icons-react";
import clsx from "clsx";
import { Header, MenuTrigger } from "react-aria-components";
import styles from "./UserAvatar.module.css";

interface UserAvatarProps {
  email: string;
  avatarSrc?: string;
  onLogout: () => void;
  isLogoutLoading?: boolean;
}

const LOGOUT_KEY = "logout";
const HEADER_EDGE_OFFSET = 12;

// `Avatar`'s initials fallback already splits an email on "._-" the same way
// the old hand-rolled `getInitials` did (see its "Initials" story), so there's
// nothing left for a local helper to do.
export default function UserAvatar({
  email,
  avatarSrc,
  onLogout,
  isLogoutLoading = false,
}: UserAvatarProps) {
  const logoutLabel = isLogoutLoading ? "Logging out…" : "Log out";

  return (
    <MenuTrigger>
      {/* react-aria wires aria-haspopup/aria-expanded onto this trigger itself,
          so the aria-label is the only accessibility prop left to supply. */}
      <Button aria-label="Account menu" variant="quiet" className={styles.trigger}>
        <Avatar name={email} src={avatarSrc} />
      </Button>
      <Popover placement="bottom end" offset={HEADER_EDGE_OFFSET} className={styles.popover}>
        <Menu
          onAction={(key) => {
            if (key === LOGOUT_KEY) onLogout();
          }}
          disabledKeys={isLogoutLoading ? [LOGOUT_KEY] : []}
        >
          <MenuSection>
            <Header className={clsx("react-aria-Header", styles.account)}>
              <Avatar name={email} src={avatarSrc} alt="" size="sm" />
              <span className={styles.email}>{email}</span>
            </Header>
          </MenuSection>
          <Separator />
          {/* `href` navigates through LagoProvider's RouterProvider (wired to
              next/navigation's router), so this needs no onAction key or
              router call of its own — unlike Log out, which is a real action
              rather than a navigation. */}
          <MenuSection>
            <MenuItem id="account" href="/account" textValue="Account">
              <User01 aria-hidden="true" />
              <SlottedText slot="label">Account</SlottedText>
            </MenuItem>
            <MenuItem id="my-lists" href="/groups" textValue="My groups">
              <Bookmark aria-hidden="true" />
              <SlottedText slot="label">My groups</SlottedText>
            </MenuItem>
          </MenuSection>
          <Separator />
          <MenuSection>
            <MenuItem id={LOGOUT_KEY} textValue={logoutLabel}>
              <LogOut01 aria-hidden="true" />
              <SlottedText slot="label">{logoutLabel}</SlottedText>
            </MenuItem>
          </MenuSection>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
