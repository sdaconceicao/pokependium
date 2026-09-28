export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface RegisterResponse {
  message: string;
}

export interface PasswordResetConfirmCredentials {
  token: string;
  password: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface PasswordResetConfirmResponse {
  access_token: string;
}

export interface EmailVerificationConfirmResponse {
  access_token: string;
}

export interface ChangePasswordCredentials {
  currentPassword: string;
  password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface AvatarResponse {
  image: string | null;
}

export interface AvatarMessageResponse {
  message: string;
}

export interface UploadAvatarVariables {
  file: File;
  onProgress?: (percent: number) => void;
}
