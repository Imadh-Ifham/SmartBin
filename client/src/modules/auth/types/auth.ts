export type UserRole = "resident" | "collector" | "authority" | "admin";

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
}
