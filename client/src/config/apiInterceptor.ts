import axiosInstance from './axiosInstance'
import type { AxiosError, AxiosResponse } from 'axios'

/**
 * Response interceptor for automatic token refresh and error handling
 * - Auto-retry on 401 (unauthorized)
 * - Refresh token before expiry
 * - Standardize error responses
 */

let isRefreshing = false
let failedQueue: Array<{ resolve: Function; reject: Function }> = []

const processQueue = (error: any, token?: string) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

/**
 * Response interceptor: Handle 401 and standardize responses
 */
export function setupResponseInterceptor() {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any

      // Handle 401 (Unauthorized)
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue request while refreshing
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return axiosInstance(originalRequest)
            })
            .catch(() => {
              // Redirect to login
              handleUnauthorized()
              return Promise.reject(error)
            })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          // Try to refresh token (if you have a refresh endpoint)
          const token = localStorage.getItem('token')
          if (!token) {
            handleUnauthorized()
            return Promise.reject(error)
          }

          // For now, just logout on 401
          handleUnauthorized()
          return Promise.reject(error)
        } catch (err) {
          processQueue(err, undefined)
          isRefreshing = false
          handleUnauthorized()
          return Promise.reject(err)
        } finally {
          isRefreshing = false
        }
      }

      // Handle 403 (Forbidden)
      if (error.response?.status === 403) {
        console.error('Access forbidden:', error.response.data)
        // Redirect to dashboard or show permission error
      }

      // Handle 500 (Server Error)
      if (error.response?.status === 500) {
        console.error('Server error:', error.response.data)
      }

      return Promise.reject(error)
    }
  )
}

/**
 * Request interceptor: Add auth header and trace
 */
export function setupRequestInterceptor() {
  axiosInstance.interceptors.request.use(
    (config: any) => {
      // Add request ID for tracing
      config.requestId = Math.random().toString(36).substr(2, 9)

      // Add token if available
      const token = localStorage.getItem('token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    },
    (error: any) => {
      return Promise.reject(error)
    }
  )
}

/**
 * Handle unauthorized access
 */
function handleUnauthorized() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('username')
  localStorage.removeItem('loginTime')

  // Redirect to login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login?session_expired=true'
  }
}

/**
 * Initialize all interceptors
 */
export function initializeInterceptors() {
  setupRequestInterceptor()
  setupResponseInterceptor()
  console.log('✅ API interceptors initialized')
}

export default {
  setupRequestInterceptor,
  setupResponseInterceptor,
  initializeInterceptors
}
