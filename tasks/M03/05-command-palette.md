# M03.05 — Command palette

## Objective
Create a command palette (similar to Cmd+K or Ctrl+K) that allows users to quickly navigate to different sections of the portfolio or perform actions using keyboard shortcuts. This enhances productivity and provides an advanced navigation mechanism for power users.

## Context
A command palette is a UI pattern popularized by applications like Slack, VS Code, and Notion. It provides a quick way to navigate, search, and execute commands via keyboard input. For a professional portfolio, this can help recruiters and visitors quickly jump to specific sections like projects, experience, or the AI assistant.

## Requirements
- Trigger command palette with Mod+K (Cmd+K on Mac, Ctrl+K on Windows/Linux)
- Display a searchable list of navigation destinations and actions
- Support fuzzy matching for quick filtering
- Allow navigation to sections via keyboard (Enter) or mouse click
- Include common destinations: HOME, WORK, PROJECTS, EXPERIENCE, ENGINEERING, RESUME, ASK AI, CONTACT
- Include relevant actions: Toggle theme, View resume, Ask AI, etc.
- Ensure accessibility (WCAG 2.2 AA) including proper focus management and screen reader support
- Implement smooth animations for opening/closing using Framer Motion
- Be visually consistent with the design system
- Escape key closes the palette
- Clicking outside closes the palette

## Scope

### In scope
- Command palette component implementation
- Keyboard shortcut handling (Mod+K)
- Search/filtering functionality with fuzzy matching
- Navigation action execution
- Theme toggle and other actions integration
- Accessibility features (focus trapping, aria labels, etc.)
- Animations using Framer Motion
- Integration with design system tokens and components

### Out of scope
- Advanced search across page content (beyond navigation items)
- Custom command execution beyond navigation/theme toggling
- Persistent history of commands
- Collaboration or sharing features
- Integration with third-party services
- Complex state management beyond visibility and search term

## Dependencies
- M02.01 – Install NeoPOP and configure Tailwind with design tokens
- M02.02 – Evaluate NeoPOP components and document selection
- M02.03 – Create compatibility layer
- M02.04 – Define elevations (shadow levels) and integrate with Tailwind
- M02.05 – Define motion (animation presets) using Framer Motion
- M02.06 – Define breakpoints and integrate with Tailwind
- M02.07 – Refine and finalize design tokens
- M02.08 – Implement dark/light themes with token overrides
- M02.09 – Create design system showcase route

## Files / Areas Expected To Change
- `src/components/command-palette/CommandPalette.tsx` (new component)
- `src/components/command-palette/index.ts` (new barrel file)
- `src/components/command-palette/commandItems.ts` (new data file for commands)
- `app/layout.tsx` (to include command palette portal)
- `src/hooks/useCommandPalette.ts` (new custom hook for keyboard shortcuts)
- `src/data/navigationItems.ts` (optional, for navigation structure)

## Implementation Guidance
1. Create a command portal that renders outside the normal DOM flow (using createPortal or fixed positioning)
2. Implement keyboard shortcut detection for Mod+K to open/close palette
3. Create a search input with real-time filtering of command items
4. Implement fuzzy matching algorithm for flexible searching
5. Define command items with icons, labels, and associated actions
6. Implement keyboard navigation (arrow keys, Enter, Escape) within the palette
7. Ensure proper focus management when opening/closing the palette
8. Use Framer Motion for smooth scale/fade animations
9. Design the palette to be visually consistent with the design system (elevated card, etc.)
10. Ensure accessibility compliance with proper roles, labels, and focus indicators

## Acceptance Criteria
- [ ] Command palette opens/closes with Mod+K keyboard shortcut
- [ ] Command palette displays searchable list of navigation destinations
- [ ] Fuzzy matching works for quick filtering (e.g., "proj" finds "PROJECTS")
- [ ] Navigation to sections works via Enter key or mouse click
- [ ] Theme toggle and other actions function correctly
- [ ] Command palette is accessible (proper focus management, screen reader friendly)
- [ ] Escape key closes the palette
- [ ] Clicking outside the palette closes it
- [ ] Smooth opening/closing animations using Framer Motion
- [ ] Visual design matches the design system
- [ ] No console errors or warnings

## Testing Requirements
- Manual testing of keyboard shortcut (Mod+K) to open/close palette
- Verify search/filtering works with various inputs
- Test keyboard navigation (arrow keys, Enter, Escape)
- Test mouse clicks on command items
- Verify theme toggle and other actions work correctly
- Check accessibility using axe or similar tools
- Test in both light and dark themes
- Verify animations are smooth and performant
- Test responsiveness on mobile devices (may adapt to bottom sheet)

## Security / Privacy Considerations
- No security concerns as it doesn't handle sensitive data
- No privacy concerns as it doesn't collect user information
- Ensure no XSS vulnerabilities in command item rendering

## Performance / Accessibility Considerations
- Debounce search input to prevent excessive re-renders
- Use efficient filtering algorithms
- Ensure focus is trapped when palette is open
- Provide sufficient color contrast for text and icons
- Follow WCAG 2.2 AA guidelines for modal dialogs
- Keep animation durations appropriate (200-300ms)
- Ensure palette doesn't interfere with screen reader navigation when closed

## Definition of Done
- Command palette component is implemented and functional
- Keyboard shortcut (Mod+K) opens and closes the palette
- Search and filtering work correctly with fuzzy matching
- Navigation and actions execute as expected
- Component is accessible and follows WCAG 2.2 AA
- All acceptance criteria are met
- Code is committed and passes linting/typechecking

## Related Requirements
- PRD.md: Information Architecture section (enhanced navigation)
- PRD.md: Homepage section (user experience)
- ROADMAP.md: Milestone 3 – Site Shell