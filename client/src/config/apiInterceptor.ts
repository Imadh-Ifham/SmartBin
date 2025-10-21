import axiosInstance from "./axiosInstance";
import type { AxiosError, AxiosResponse } from "axios";
import { tokenStore } from "../api/auth/tokenStore";
import { apiRefresh } from "../api/auth/auth.api";

/**
 * Response interceptor for automatic token refresh and error handling
 * - Auto-retry on 401 (unauthorized)
 * - Refresh token before expiry
 * - Standardize error responses
 */

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token ?? "");
    }
  });
  failedQueue = [];
};

/**
 * Response interceptor: Handle 401 and standardize responses
 */
export function setupResponseInterceptor() {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      const url = (originalRequest?.url as string) || "";
      const isAuthEndpoint = /\/auth\/(login|register|refresh|logout)$/i.test(
        url
      );

      // Handle 401 (Unauthorized)
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isAuthEndpoint
      ) {
        if (isRefreshing) {
          // Queue request while refreshing
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers = {
                ...(originalRequest.headers || {}),
                Authorization: `Bearer ${token}`,
              };
              return axiosInstance(originalRequest);
            })
            .catch((err) => {
              handleUnauthorized();
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt refresh using httpOnly cookie
          const { accessToken } = await apiRefresh();
          tokenStore.set(accessToken);
          processQueue(null, accessToken);
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${accessToken}`,
          };
          return axiosInstance(originalRequest);
        } catch (err) {
          processQueue(err as any, undefined);
          isRefreshing = false;
          handleUnauthorized();
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle 403 (Forbidden)
      if (error.response?.status === 403) {
        console.error("Access forbidden:", error.response.data);
        // Redirect to dashboard or show permission error
      }

      // Handle 500 (Server Error)
      if (error.response?.status === 500) {
        console.error("Server error:", error.response.data);
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Request interceptor: Add auth header and trace
 */
export function setupRequestInterceptor() {
  axiosInstance.interceptors.request.use(
    (config: any) => {
      // Add request ID for tracing
      config.requestId = Math.random().toString(36).substr(2, 9);

      // Add token if available (in-memory)
      let token = tokenStore.get();
      if (!token && typeof window !== "undefined") {
        try {
          token = localStorage.getItem("token");
        } catch {}
      }
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );
}

/**
 * Handle unauthorized access
 */
function handleUnauthorized() {
  tokenStore.clear();

  // Redirect to login
  if (window.location.pathname !== "/login") {
    window.location.href = "/login?session_expired=true";
  }
}

/**
 * Initialize all interceptors
 */
export function initializeInterceptors() {
  setupRequestInterceptor();
  setupResponseInterceptor();
  console.log("✅ API interceptors initialized");
}

export default {
  setupRequestInterceptor,
  setupResponseInterceptor,
  initializeInterceptors,
};
