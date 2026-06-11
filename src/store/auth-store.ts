import { create } from 'zustand';
import { API_URL } from '@/constants/api';

export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN';

interface User {
  id: string;
  name: string;
  role: UserRole;
  shopName?: string;
  phone?: string;
  avatarUrl?: string;
  address?: string;
  vendorType?: 'MEAT_SHOP' | 'POULTRY_FARM' | string;
  latitude?: number | null;
  longitude?: number | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (phone: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setAuth: (user: User, token: string) => void;
}

interface RegisterData {
  name: string;
  phone: string;
  password: string;
  role: UserRole;
  shopName?: string;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (phone: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        set({ isLoading: false, error: data.error || 'Login failed' });
        return false;
      }

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err) {
      set({ isLoading: false, error: 'Network error. Check your connection.' });
      return false;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        set({ isLoading: false, error: result.error || 'Registration failed' });
        return false;
      }

      set({ isLoading: false, error: null });
      return true;
    } catch (err) {
      set({ isLoading: false, error: 'Network error. Check your connection.' });
      return false;
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  setAuth: (user: User, token: string) => {
    set({ user, token, isAuthenticated: true });
  },
}));
