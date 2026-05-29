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

// In-memory cache to prevent redundant fallback profile lookups
const resolvedProfileCache: Record<string, { hotels: any[]; hotelId?: string }> = {};

// Interceptor to resolve missing hotelId dynamically using the Main service fallback
apiClient.interceptors.response.use(
  async (response) => {
    const url = response.config.url || "";
    if (url.includes("/AuthForward/auth/api/email/")) {
      const responseData = response.data;
      if (responseData && responseData.success && responseData.data) {
        const userData = responseData.data;
        const hotelId = userData.hotelId || userData.hotels?.[0]?.id;
        if (!hotelId && userData.id) {
          // Check cache first
          const cached = resolvedProfileCache[userData.id];
          if (cached) {
            userData.hotels = cached.hotels;
            userData.hotelId = cached.hotelId;
            return response;
          }

          try {
            console.log(`[apiClient Interceptor] Fallback profile fetch for user: ${userData.id}`);
            const token = await AsyncStorage.getItem('authToken');
            const headers: Record<string, string> = {
              "Content-Type": "application/json"
            };
            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
            }
            // Use native axios to bypass this interceptor and avoid recursion
            const fallbackRes = await axios.get(
              `${API_BASE_URL}/Main/router-backend/api/users/${userData.id}`,
              { headers }
            );
            if (fallbackRes.data?.success && fallbackRes.data.data) {
              const fullUser = fallbackRes.data.data;
              userData.hotels = fullUser.hotels || [];
              if (fullUser.hotels?.[0]?.id) {
                userData.hotelId = fullUser.hotels[0].id;
              }
              // Cache the resolved data
              resolvedProfileCache[userData.id] = {
                hotels: userData.hotels,
                hotelId: userData.hotelId
              };
              console.log(`[apiClient Interceptor] Successfully fetched and cached fallback hotelId: ${userData.hotelId}`);
            }
          } catch (err: any) {
            console.warn("[apiClient Interceptor] Fallback user fetch failed:", err.message || err);
          }
        }
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
