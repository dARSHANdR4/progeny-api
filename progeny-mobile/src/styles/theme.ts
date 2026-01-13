import { TextStyle, ViewStyle } from 'react-native';

export const COLORS = {
  primary: '#2D5A27', // Deep Forest Green
  primaryLight: '#4E8B42',
  secondary: '#8B5A2B', // Soil Brown
  accent: '#F97316', // Modern Orange (matches web accent)
  background: '#F5F7F2',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  error: '#D32F2F',
  errorLight: '#FFEBEE',
  warning: '#FBC02D',
  warningLight: '#FFF8E1',
  success: '#388E3C',
  successLight: '#E8F5E9',
  info: '#1976D2',
  infoLight: '#E3F2FD',
  border: '#E0E0E0',
  card: '#FFFFFF',
  // Premium colors
  premiumPurple: '#9333EA',
  premiumPink: '#EC4899',
  premiumLight: '#F3E8FF',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const TYPOGRAPHY: Record<string, TextStyle> = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
  },
  bodySmall: {
    fontSize: 13,
  },
  bodySecondary: {
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  caption: {
    fontSize: 10,
  },
};

export const SHADOWS: Record<string, ViewStyle> = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};
