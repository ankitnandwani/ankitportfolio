import { tokens, lightTheme, darkTheme } from "../../design";

// Simple usage to ensure type safety
const primary = tokens.colors.primary;
const spacingMd = tokens.spacing.md;
const fontFamily = tokens.typography.fontFamily;

// Use themes in a dummy function
function getBackground(theme: { colors: { background: string } }) {
  return theme.colors.background;
}

const bgLight = getBackground(lightTheme);
const bgDark = getBackground(darkTheme);

export { primary, spacingMd, fontFamily, bgLight, bgDark };
