import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/auth-store';

// export const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
export const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log errors for debugging in production
    if (__DEV__) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        // Unauthorized - try token refresh if we have a refresh mechanism
        // For now, clear auth and redirect to login
        const originalRequest = error.config;
        
        // Avoid infinite loop
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          
          // Clear auth state
          useAuthStore.getState().logout();
          
          // Note: In a production app with refresh tokens, you would:
          // 1. Attempt to refresh the token
          // 2. If successful, retry the original request
          // 3. If failed, clear auth and redirect to login
        }
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error - no response received');
    } else {
      // Error in request configuration
      console.error('Request configuration error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
