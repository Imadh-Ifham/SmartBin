import { useState, useCallback } from "react";
import { AuthService } from "./authService";
import { PolicyService } from "../services/PolicyService";
import axiosInstance from "../../config/axiosInstance";

const authService = new AuthService();

interface AuthState {
  isAuthenticated: boolean;
  user: { username: string; role: string } | null;
  token: string | null;
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    return {
      isAuthenticated: !!token,
      user: token ? { username: username || "Admin", role: role || "admin" } : null,
      token
    };
  });

  /**
   * Set global authentication headers across all HTTP clients
   */
  const setGlobalAuth = useCallback((token?: string | null) => {
    try {
      if (token) {
        // Set axios default header
        (axiosInstance.defaults as any).headers = {
          ...(axiosInstance.defaults as any).headers,
          Authorization: `Bearer ${token}`,
        };
        // Set PolicyService header as well
        PolicyService.setAuthToken(token);
      } else {
        if ((axiosInstance.defaults as any).headers?.Authorization) {
          delete (axiosInstance.defaults as any).headers.Authorization;
        }
        PolicyService.setAuthToken(null);
      }
    } catch (err) {
      console.warn("Failed to set global auth headers:", err);
    }
  }, []);

  /**
   * Login with credentials
   */
  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await authService.login(username, password);
      console.log("✅ Login successful for user:", username);

      // Store auth data securely
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);
      localStorage.setItem("username", res.username);
      localStorage.setItem("loginTime", new Date().toISOString());

      // Update auth state
      setAuthState({
        isAuthenticated: true,
        user: { username: res.username, role: res.role },
        token: res.token
      });

      // Set axios headers immediately
      setGlobalAuth(res.token);

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 300);
    } catch (err: any) {
      console.error("❌ Login error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Login failed";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [setGlobalAuth]);

  /**
   * Logout and clear session
   */
  const logout = useCallback(() => {
    // Clear all auth data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("loginTime");

    // Reset auth state
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null
    });

    // Clear axios headers
    setGlobalAuth(null);

    console.log("✅ Logged out successfully");
  }, [setGlobalAuth]);

  /**
   * Check if token is still valid
   */
  const isTokenValid = useCallback((): boolean => {
    const token = localStorage.getItem("token");
    const loginTime = localStorage.getItem("loginTime");

    if (!token || !loginTime) return false;

    // Check if token has expired (1 hour = 3600 seconds)
    const elapsedSeconds = (Date.now() - new Date(loginTime).getTime()) / 1000;
    const tokenExpirySeconds = 3600;

    return elapsedSeconds < tokenExpirySeconds;
  }, []);

  /**
   * Initialize auth on mount
   */
  const initializeAuth = useCallback(() => {
    const token = localStorage.getItem("token");
    if (token && isTokenValid()) {
      setGlobalAuth(token);
      return true;
    }
    logout();
    return false;
  }, [isTokenValid, setGlobalAuth, logout]);

  return {
    login,
    logout,
    loading,
    error,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    token: authState.token,
    isTokenValid,
    initializeAuth
  };
}
