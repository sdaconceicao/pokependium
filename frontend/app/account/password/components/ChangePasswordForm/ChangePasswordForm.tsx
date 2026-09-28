"use client";

import { Button, Form, Password } from "@code-x/lago";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import SignInPrompt from "@/components/SignInPrompt";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/toast";
import { validateNewPassword } from "@/lib/validation";
import styles from "./ChangePasswordForm.module.css";

type Field = "currentPassword" | "password" | "confirmPassword";

export default function ChangePasswordForm() {
  const router = useRouter();
  const { user, isLoading, changePasswordAsync, isChangePasswordLoading } = useAuth();

  const [values, setValues] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: Field, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {
      ...validateNewPassword(values.password, values.confirmPassword),
    };
    if (!values.currentPassword) {
      newErrors.currentPassword = "Your current password is required";
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    try {
      await changePasswordAsync({
        currentPassword: values.currentPassword,
        password: values.password,
      });
      notify({
        title: "Password updated",
        description: "Use your new password next time you sign in.",
        variant: "success",
      });
      router.replace("/account");
    } catch (error) {
      notify({
        title: "Password change failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  // Loading first: useAuth reports user undefined until mount, which would flash SignInPrompt.
  if (isLoading) return null;
  if (!user) {
    return <SignInPrompt message="Sign in to change your password." />;
  }

  return (
    <Form onSubmit={handleSubmit} validationBehavior="aria">
      <Password
        label="Current password"
        isRequired
        value={values.currentPassword}
        onChange={(value) => handleInputChange("currentPassword", value)}
        placeholder="Enter your current password"
        autoComplete="current-password"
        isInvalid={!!errors.currentPassword}
        errorMessage={errors.currentPassword}
        isDisabled={isChangePasswordLoading}
      />

      <Password
        label="New password"
        isRequired
        value={values.password}
        onChange={(value) => handleInputChange("password", value)}
        placeholder="Enter a new password"
        autoComplete="new-password"
        isInvalid={!!errors.password}
        errorMessage={errors.password}
        isDisabled={isChangePasswordLoading}
      />

      <Password
        label="Confirm new password"
        isRequired
        value={values.confirmPassword}
        onChange={(value) => handleInputChange("confirmPassword", value)}
        placeholder="Re-enter the new password"
        autoComplete="new-password"
        isInvalid={!!errors.confirmPassword}
        errorMessage={errors.confirmPassword}
        isDisabled={isChangePasswordLoading}
      />

      <div className={styles.actions}>
        <Button type="submit" variant="primary" isDisabled={isChangePasswordLoading}>
          {isChangePasswordLoading ? "Saving…" : "Change password"}
        </Button>
        <Button
          type="button"
          variant="quiet"
          onPress={() => router.push("/account")}
          isDisabled={isChangePasswordLoading}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
}
