import { tokens } from "../tokens";

/**
 * Dark theme - overrides token values for dark mode.
 */
export const darkTheme = {
  ...tokens,
  colors: {
    ...tokens.colors,
    background: "#121212",
    surface: "#1E1E1E",
    text: "#E0E0E0",
    primary: "#90CAF9", // lighter blue for contrast on dark background
    accent: "#FFAB40", // lighter orange
  },
  elevation: {
    none: "0 0 #0000",
    sm: "0 1px 3px rgba(255,255,255,0.1), 0 1px 2px rgba(255,255,255,0.06)",
    md: "0 4px 6px rgba(255,255,255,0.1), 0 2px 4px rgba(255,255,255,0.08)",
    lg: "0 8px 10px rgba(255,255,255,0.14), 0 3px 14px rgba(255,255,255,0.12), 0 5px 5px -3px rgba(255,255,255,0.2)",
    xl: "0 10px 20px rgba(255,255,255,0.19), 0 6px 6px rgba(255,255,255,0.23)",
  },
};