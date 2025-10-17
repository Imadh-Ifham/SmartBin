import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
// attach token from localStorage if available
try {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    (axiosInstance.defaults as any).headers = {
      ...(axiosInstance.defaults as any).headers,
      Authorization: `Bearer ${token}`,
    };
  }
} catch (err) {
  // ignore in non-browser environments
}

export default axiosInstance;