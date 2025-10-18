export type UserRole = "resident" | "collector" | "authority" | "admin";

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  residentId?: string;
  collectorId?: string;
  authorityId?: string;
  adminId?: string;
}
