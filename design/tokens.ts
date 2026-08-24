export const tokens = {
  colors: {
    primary: "#1A73E8",
    background: "#FFFFFF",
    surface: "#F5F5F5",
    text: "#212121",
    accent: "#FF5722",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: {
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
    },
    lineHeight: {
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  radius: {
    none: "0",
    sm: "4px",
    md: "8px",
    lg: "12px",
  },
} as const;
