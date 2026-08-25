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
    extend: {
      colors: {
        primary: tokens.colors.primary,
        background: tokens.colors.background,
        surface: tokens.colors.surface,
        text: tokens.colors.text,
        accent: tokens.colors.accent,
      },
      spacing: {
        xs: tokens.spacing.xs / 4, // 4px -> 1
        sm: tokens.spacing.sm / 4, // 8px -> 2
        md: tokens.spacing.md / 4, // 16px -> 4
        lg: tokens.spacing.lg / 4, // 24px -> 6
        xl: tokens.spacing.xl / 4, // 32px -> 8
      },
      fontSize: tokens.typography.fontSize,
      lineHeight: tokens.typography.lineHeight,
      borderRadius: tokens.radius, // Tailwind uses borderRadius for radius
      boxShadow: ({ theme }) => ({
        ...theme('boxShadow'),
        ...tokens.elevation,
      }),
    },
  },
  plugins: [],
};