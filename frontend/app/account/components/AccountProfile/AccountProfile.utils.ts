import type { User } from "@/types";

export type AccountProfileState = "loading" | "signedOut" | "error" | "ready";

export const resolveAccountProfileState = (
  isAuthLoading: boolean,
  user: User | undefined,
  error: Error | null | undefined,
): AccountProfileState => {
  if (isAuthLoading) return "loading";
  // Before error, matching resolveGroupSettingsState: a failed fetch leaves user undefined.
  if (!user) return "signedOut";
  if (error) return "error";
  return "ready";
};
