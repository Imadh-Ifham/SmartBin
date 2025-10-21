import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default axiosInstance;
