/**
 * Global Design Palette for My_Business
 *
 * Luxury, high-trust commerce palette:
 * - Primary: Deep Maroon / Burgundy (#49212B)
 * - Pressed Primary: Darker Rich Wine (#351820)
 * - Champagne Accent: Warm Luxury Champagne Gold (#DCC69B)
 * - App Background: Warm Soft Alabaster / Cream (#F6F0E8)
 * - Card Background: Pure Crisp White (#FFFFFF)
 * - Primary Text: Deep Charcoal Espresso (#292426)
 * - Secondary Text: Muted Warm Slate / Taupe (#655B5D)
 */

export const colors = {
  // Brand Primary
  primary: '#49212B',
  primaryPressed: '#351820',
  primaryLight: '#F7EEF2',
  primaryLightBorder: '#E5D2DA',
  primaryDark: '#2C121A',

  // Champagne Gold Accent
  champagne: '#DCC69B',
  champagnePressed: '#CBB285',
  champagneLight: '#FAF5ED',
  champagneBorder: '#E6D7BF',
  champagneDark: '#8F7546',

  // Backgrounds
  background: '#F6F0E8',
  backgroundSubtle: '#F0E9DF',
  alabasterWarm: '#EFE9DF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  // Typography
  textPrimary: '#292426',
  textSecondary: '#655B5D',
  textMuted: '#9B9193',
  textInverse: '#FFFFFF',
  textOnChampagne: '#3A2710',

  // Borders & Dividers
  border: '#E8E0D5',
  borderLight: '#F0EAE1',
  borderDark: '#D4C9BD',

  // Functional / Status Colors (Tailored to warm luxury theme)
  success: '#1B6B45',
  successBg: '#EAF6EF',
  successBackground: '#EAF6EF',
  successBorder: '#BFE4D0',
  successText: '#125434',

  error: '#9E2A2B',
  errorBg: '#FCEAEA',
  errorBorder: '#F5C2C3',
  errorText: '#7B1E20',

  // Danger aliases (common aliases for error)
  danger: '#9E2A2B',
  dangerBg: '#FCEAEA',
  dangerLight: '#FCEAEA',
  dangerBorder: '#F5C2C3',

  warning: '#B4691B',
  warningBg: '#FDF3E7',
  warningBorder: '#F8DCB8',
  warningText: '#874D11',

  info: '#49212B',
  infoBg: '#F7EEF2',
  infoBorder: '#E5D2DA',
  infoText: '#49212B',

  // Shadows
  shadow: '#292426',
};

export type ThemeColors = typeof colors;
