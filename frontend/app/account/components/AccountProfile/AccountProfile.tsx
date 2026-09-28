"use client";

import { Alert, Heading, Link, Skeleton } from "@code-x/lago";
import { Edit05 } from "@untitled-ui/icons-react";
import type { ReactNode } from "react";
import SignInPrompt from "@/components/SignInPrompt";
import { useAuth } from "@/hooks/useAuth";
import AccountAvatar from "../AccountAvatar";
import styles from "./AccountProfile.module.css";
import { resolveAccountProfileState } from "./AccountProfile.utils";

const SKELETON_KEYS = [0, 1];

function AccountProfileSkeleton() {
  return (
    <div className={styles.list} aria-hidden="true">
      {SKELETON_KEYS.map((key) => (
        <Skeleton
          key={key}
          variant="line"
          height={40}
          label={key === 0 ? "Loading your account" : undefined}
        />
      ))}
    </div>
  );
}

export default function AccountProfile() {
  const { user, isLoading, error } = useAuth();

  const state = resolveAccountProfileState(isLoading, user, error);

  let content: ReactNode;
  switch (state) {
    case "loading":
      content = <AccountProfileSkeleton />;
      break;
    case "signedOut":
      content = <SignInPrompt message="Sign in to manage your account." />;
      break;
    case "error":
      content = (
        <Alert variant="error">
          <Alert.Header title="Couldn't load your account" subtitle={error?.message} />
        </Alert>
      );
      break;
    case "ready":
      content = (
        <>
          <dl className={styles.list}>
            <div className={styles.row}>
              <dt className={styles.label}>Email</dt>
              <dd className={styles.value}>{user?.email}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>Username</dt>
              <dd className={styles.value}>{user?.username}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>Password</dt>
              <dd className={`${styles.value} ${styles.passwordValue}`}>
                <span className={styles.mask} aria-hidden="true">
                  **********
                </span>
                <Link
                  href="/account/password"
                  aria-label="Change your password"
                  className={styles.editLink}
                >
                  <Edit05 aria-hidden="true" />
                </Link>
              </dd>
            </div>
            {/* Registration leaves both names empty, so each row appears only
                once there is something in it — no bare labels. */}
            {user?.firstName ? (
              <div className={styles.row}>
                <dt className={styles.label}>First name</dt>
                <dd className={styles.value}>{user.firstName}</dd>
              </div>
            ) : null}
            {user?.lastName ? (
              <div className={styles.row}>
                <dt className={styles.label}>Last name</dt>
                <dd className={styles.value}>{user.lastName}</dd>
              </div>
            ) : null}
          </dl>
          <AccountAvatar className={styles.avatar} />
        </>
      );
      break;
  }

  return (
    <section className={styles.container}>
      <Heading level={1} className={styles.heading}>
        Your account
      </Heading>
      {content}
    </section>
  );
}
