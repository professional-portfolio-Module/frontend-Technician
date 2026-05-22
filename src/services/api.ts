import axios from "axios";

// Base URL for the BFF API
// Expo Web defaults to localhost:8081 but uses the same origin when served.
// We'll hardcode the deployed BFF URL here, or use localhost if running backend locally.
const API_BASE_URL = "https://bffserviceprod-production.up.railway.app/BFF/api/proxy/AuthForward";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
