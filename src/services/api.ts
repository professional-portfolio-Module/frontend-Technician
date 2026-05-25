import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the BFF API
// Expo Web defaults to localhost:8081 but uses the same origin when served.
// We'll hardcode the deployed BFF URL here, or use localhost if running backend locally.
const API_BASE_URL = "https://bffserviceprod-production.up.railway.app/BFF/api/proxy";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error reading token", error);
  }
  return config;
});

export default apiClient;
