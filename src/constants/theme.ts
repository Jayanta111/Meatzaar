/**
 * Meatzaar App Design System
 * Premium dark-first design with vibrant meat-industry colors
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Core
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    background: '#FAFAFA',
    backgroundElement: '#F3F4F6',
    backgroundSelected: '#E5E7EB',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    // Brand
    primary: '#E53935',
    primaryDark: '#C62828',
    primaryLight: '#FF6F61',
    secondary: '#10B981',
    secondaryDark: '#059669',
    accent: '#F59E0B',

    // Semantic
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // UI Elements
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    shadow: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#E53935',

    // Cards
    cardBackground: '#FFFFFF',
    cardBorder: '#F3F4F6',

    // Gradient endpoints
    gradientStart: '#E53935',
    gradientEnd: '#FF6F61',
  },
  dark: {
    // Core
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    background: '#0F0F1A',
    backgroundElement: '#1A1A2E',
    backgroundSelected: '#2A2A3E',
    surface: '#16162A',
    surfaceElevated: '#1E1E36',

    // Brand
    primary: '#FF5252',
    primaryDark: '#E53935',
    primaryLight: '#FF8A80',
    secondary: '#34D399',
    secondaryDark: '#10B981',
    accent: '#FBBF24',

    // Semantic
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',

    // UI Elements
    border: '#2A2A3E',
    borderLight: '#1E1E36',
    shadow: 'rgba(0, 0, 0, 0.4)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#FF5252',

    // Cards
    cardBackground: '#16162A',
    cardBorder: '#2A2A3E',

    // Gradient endpoints
    gradientStart: '#FF5252',
    gradientEnd: '#FF8A80',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 48,
  '6xl': 64,

  // Legacy aliases
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
