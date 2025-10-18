import axios from "../../config/axiosInstance";
import { tokenStore } from "./tokenStore";
import type {
  LoginCredentials,
  RegisterData,
  User,
} from "../../modules/auth/types/auth";

export type AuthResponse = {
  accessToken: string;
  user: User;
  generatedId?: string;
};

export async function apiLogin(data: LoginCredentials): Promise<AuthResponse> {
  const res = await axios.post<AuthResponse>("/auth/login", data, {
    withCredentials: true,
  });
  tokenStore.set(res.data.accessToken);
  try {
    localStorage.setItem("token", res.data.accessToken);
  } catch {}
  return res.data;
}

export async function apiRegister(data: RegisterData): Promise<AuthResponse> {
  const payload = {
    username: data.username,
    password: data.password,
    role: data.role,
  };
  const res = await axios.post<AuthResponse>("/auth/register", payload, {
    withCredentials: true,
  });
  tokenStore.set(res.data.accessToken);
  try {
    localStorage.setItem("token", res.data.accessToken);
  } catch {}
  return res.data;
}

export async function apiMe(): Promise<User> {
  const res = await axios.get<User>("/auth/me", { withCredentials: true });
  return res.data;
}

export async function apiLogout(): Promise<void> {
  await axios.post("/auth/logout", {}, { withCredentials: true });
  tokenStore.clear();
  try {
    localStorage.removeItem("token");
  } catch {}
}

export async function apiRefresh(): Promise<{ accessToken: string }> {
  const res = await axios.post<{ accessToken: string }>(
    "/auth/refresh",
    {},
    { withCredentials: true }
  );
  tokenStore.set(res.data.accessToken);
  try {
    localStorage.setItem("token", res.data.accessToken);
  } catch {}
  return res.data;
}
