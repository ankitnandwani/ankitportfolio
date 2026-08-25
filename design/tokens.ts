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
  elevation: {
    none: "0 0 #0000",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
  },
} as const;
