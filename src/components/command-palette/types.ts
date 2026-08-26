export interface CommandItem {
  label: string;
  href?: string; // For navigation items
  action?: string; // For action items (toggleTheme, viewResume, askAI)
  icon?: string; // Icon name (to be implemented with actual icons later)
}