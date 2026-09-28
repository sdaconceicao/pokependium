"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "@/components/AuthButtons/AuthButtons.module.css";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/toast";

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { confirmEmailVerificationAsync } = useAuth();

  const [error, setError] = useState("");
  // StrictMode double-invokes effects in dev; a second attempt would fail
  // against the already-flipped flag and show a spurious error.
  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;

    confirmEmailVerificationAsync(token)
      .then(() => {
        notify({
          title: "Email verified",
          description: "You are now signed in.",
          variant: "success",
        });
        router.replace("/");
      })
      .catch((caught: unknown) => {
        const message = caught instanceof Error ? caught.message : "Verification failed";
        setError(message);
        notify({
          title: "Verification failed",
          description: message,
          variant: "error",
        });
      });
  }, [token, confirmEmailVerificationAsync, router]);

  if (!token) {
    return (
      <p className={styles.submitError}>
        This verification link is missing its token. Sign up again with the same email to get a new
        one.
      </p>
    );
  }

  if (error) {
    return (
      <div>
        <p className={styles.submitError}>{error}</p>
        <p className={styles.sentMessage}>
          Verification links expire and can only be used once. Sign up again with the same email to
          get a new one.
        </p>
      </div>
    );
  }

  return <p className={styles.sentMessage}>Verifying your account…</p>;
}
