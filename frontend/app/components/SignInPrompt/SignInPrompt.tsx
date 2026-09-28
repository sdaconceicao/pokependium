"use client";

import { Button } from "@code-x/lago";
import { useAuthModal } from "@/providers/AuthModalProvider";
import styles from "./SignInPrompt.module.css";

interface SignInPromptProps {
  message: string;
}

export default function SignInPrompt({ message }: SignInPromptProps) {
  const { openSignIn } = useAuthModal();

  return (
    <div className={styles.prompt}>
      <p>{message}</p>
      <Button variant="primary" onPress={openSignIn}>
        Sign In
      </Button>
    </div>
  );
}
