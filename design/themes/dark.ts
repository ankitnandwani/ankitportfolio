import { tokens } from "../tokens";

export const darkTheme = {
  ...tokens,
  colors: {
    ...tokens.colors,
    background: "#121212",
    // Optionally adjust other colors for dark mode.
    // For example, you might invert text color for contrast.
    text: "#FFFFFF",
    surface: "#212121",
  },
};
