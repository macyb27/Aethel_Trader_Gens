/** @type {const} */
const themeColors = {
  // Cyan accent - the signature trading color
  primary: { light: '#00D9FF', dark: '#00D9FF' },
  // Secondary red for sell/negative
  secondary: { light: '#FF6B6B', dark: '#FF6B6B' },
  // Deep dark backgrounds for professional trading feel
  background: { light: '#0A0A0F', dark: '#0A0A0F' },
  // Slightly elevated surface for cards
  surface: { light: '#12121A', dark: '#12121A' },
  // White text on dark backgrounds
  foreground: { light: '#FFFFFF', dark: '#FFFFFF' },
  // Muted secondary text
  muted: { light: '#8B8B9A', dark: '#8B8B9A' },
  // Subtle borders
  border: { light: '#1E1E2D', dark: '#1E1E2D' },
  // Status colors
  success: { light: '#00C853', dark: '#4ADE80' },
  warning: { light: '#FFB800', dark: '#FBBF24' },
  error: { light: '#FF4757', dark: '#F87171' },
};

module.exports = { themeColors };
