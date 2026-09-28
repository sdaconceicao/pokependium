"use client";

import { Button, Form, Password } from "@code-x/lago";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useState } from "react";
import styles from "@/components/AuthButtons/AuthButtons.module.css";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/toast";
import { validateNewPassword } from "@/lib/validation";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { confirmPasswordResetAsync, isConfirmPasswordResetLoading } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: "password" | "confirmPassword", value: string) => {
    if (field === "password") setPassword(value);
    else setConfirmPassword(value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {
      ...validateNewPassword(password, confirmPassword),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    try {
      await confirmPasswordResetAsync({ token, password });
      notify({
        title: "Password updated",
        description: "Your password has been updated.",
        variant: "success",
      });
      router.replace("/");
    } catch (error) {
      notify({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  if (!token) {
    return (
      <p className={styles.submitError}>
        This reset link is missing its token. Request a new link from the sign-in screen.
      </p>
    );
  }

  return (
    <Form onSubmit={handleSubmit} validationBehavior="aria">
      <Password
        label="New password"
        isRequired
        value={password}
        onChange={(value) => handleInputChange("password", value)}
        placeholder="Enter a new password"
        autoComplete="new-password"
        isInvalid={!!errors.password}
        errorMessage={errors.password}
        isDisabled={isConfirmPasswordResetLoading}
      />

      <Password
        label="Confirm new password"
        isRequired
        value={confirmPassword}
        onChange={(value) => handleInputChange("confirmPassword", value)}
        placeholder="Re-enter the new password"
        autoComplete="new-password"
        isInvalid={!!errors.confirmPassword}
        errorMessage={errors.confirmPassword}
        isDisabled={isConfirmPasswordResetLoading}
      />

      <div className={styles.formActions}>
        <Button type="submit" variant="primary" isDisabled={isConfirmPasswordResetLoading}>
          {isConfirmPasswordResetLoading ? "Saving…" : "Set new password"}
        </Button>
      </div>
    </Form>
  );
}
