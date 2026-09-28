import type {
  AvatarMessageResponse,
  AvatarResponse,
  ChangePasswordCredentials,
  ChangePasswordResponse,
  EmailVerificationConfirmResponse,
  LoginCredentials,
  LoginResponse,
  PasswordResetConfirmCredentials,
  PasswordResetConfirmResponse,
  PasswordResetResponse,
  RegisterCredentials,
  RegisterResponse,
  User,
} from "../types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3004";

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

export const requireStoredToken = (): string => {
  const token = getStoredToken();
  if (!token) throw new Error("No token provided");
  return token;
};

export const setStoredToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", token);
};

const removeStoredToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
};

/** XMLHttpRequest has no `.json()`, and an error body may not be JSON at all. */
const parseJsonOrEmpty = (text: string): Record<string, string> => {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Login failed");
    }

    return response.json();
  },

  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Registration failed");
    }

    return response.json();
  },

  async requestPasswordReset(email: string): Promise<PasswordResetResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Password reset request failed");
    }

    return response.json();
  },

  async confirmPasswordReset(
    credentials: PasswordResetConfirmCredentials,
  ): Promise<PasswordResetConfirmResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Password reset failed");
    }

    return response.json();
  },

  async changePassword(
    token: string,
    credentials: ChangePasswordCredentials,
  ): Promise<ChangePasswordResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Password change failed");
    }

    return response.json();
  },

  async confirmEmailVerification(token: string): Promise<EmailVerificationConfirmResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Verification failed");
    }

    return response.json();
  },

  async getAvatar(token: string): Promise<AvatarResponse> {
    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch avatar");
    }

    return response.json();
  },

  async uploadAvatar(
    token: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<AvatarMessageResponse> {
    const body = new FormData();
    body.append("file", file);

    // XHR rather than fetch: request-body progress for a determinate bar.
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}/users/avatar`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      // Let the browser set the multipart boundary.

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        const payload = parseJsonOrEmpty(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payload as unknown as AvatarMessageResponse);
          return;
        }
        reject(new Error(payload.message || "Avatar upload failed"));
      };

      xhr.onerror = () => reject(new Error("Avatar upload failed"));
      xhr.send(body);
    });
  },

  async deleteAvatar(token: string): Promise<AvatarMessageResponse> {
    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to remove avatar");
    }

    return response.json();
  },

  async getCurrentUser(token: string): Promise<User> {
    if (!token) throw new Error("No token provided");

    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    return response.json();
  },

  async logout(): Promise<void> {
    removeStoredToken();
  },
};
