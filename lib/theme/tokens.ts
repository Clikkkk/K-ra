export const colors = {
  background: '#15140F',
  surface: '#1E1D18',
  surfaceRaised: '#292721',
  border: '#35332C',
  text: '#F4F2EE',
  textMuted: '#A39E94',
  textDisabled: '#6D6960',
  accent: '#C9834A',
  accentMuted: '#4D3627',
  danger: '#E5484D',
  success: '#3DD68C',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

export const typography = {
  family: {
    base: undefined,
    mono: 'SpaceMono',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 34,
    xxl: 42,
  },
  weight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
} as const;

export type Theme = typeof theme;
