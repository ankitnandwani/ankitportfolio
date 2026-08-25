/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { tokens } = require('./design/tokens');

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './design/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      sm: tokens.breakpoints.sm,
      md: tokens.breakpoints.md,
      lg: tokens.breakpoints.lg,
      xl: tokens.breakpoints.xl,
      // xxl: tokens.breakpoints.xxl,
    },
    extend: {
      colors: {
        primary: tokens.colors.primary,
        background: tokens.colors.background,
        surface: tokens.colors.surface,
        text: tokens.colors.text,
        accent: tokens.colors.accent,
      },
      spacing: Object.keys(tokens.spacing).reduce((acc, key) => {
        acc[key] = tokens.spacing[key] / 4;
        return acc;
      }, {}),
      fontSize: tokens.typography.fontSize,
      lineHeight: tokens.typography.lineHeight,
      fontWeight: tokens.typography.fontWeight,
      letterSpacing: tokens.typography.letterTracking,
      borderRadius: tokens.radius,
      boxShadow: ({ theme }) => ({
        ...theme('boxShadow'),
        ...tokens.elevation,
      }),
    },
  },
  plugins: [],
};