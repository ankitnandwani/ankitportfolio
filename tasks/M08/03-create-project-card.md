# M08.03 — Create project card component

## Objective

Build the visual `ProjectCard` component displaying a project's name, value proposition, category, technologies, motivation, learning outcomes, architectural highlights, and external links with a clear visual hierarchy.

## Context

According to PRD §17, project cards should show: PROJECT NAME, one-line value proposition, CATEGORY, Technologies, Why I built it, What I learned, Architecture, GitHub, Live Demo. The card must clearly present the project's purpose, technical depth, and actionable links while maintaining a compact, elevated design.

## Requirements

- Create `ProjectCard` in `src/components/projects/ProjectCard.tsx`
- Utilize the design system `Card` component from `@/src/components/ui/Card`
- Implement clear visual sections inside the card:
  * Category badge (e.g. "Personal Engineering" in accent/primary color)
  * Prominent project name (heading level 3 or 4)
  * Value proposition (one-line description)
  * Why I built it (motivation/context)
  * What I learned (outcomes/insights)
  * Architecture (high-level overview)
  * Technologies (as styled badges/pills)
  * GitHub and Live Demo links (as buttons or external links)
- Support light and dark theme using tokens from `useTheme()`
- Follow NeoPOP design tokens for borders, elevation, typography, and colors
- Export component through barrel index `src/components/projects/index.ts`

## Scope

### In scope
- Component implementation of `ProjectCard`
- Typography and visual styling following NeoPOP tokens
- Displaying all fields from the `Project` interface
- Technology badge styling
- External link rendering (GitHub, demo)

### Out of scope
- Project list/grid container layout (handled in M08.04)
- Complex motion/animations (handled in M08.09)
- Mobile-specific responsive refactoring (handled in M08.08)
- Project detail page routing (handled in M08.06)

## Dependencies
- M08.01 – Define project data model (needs `Project` interface)
- M08.04 – Create project list component (will use this card)

## Files / Areas Expected To Change
- `src/components/projects/ProjectCard.tsx` (new file)
- `src/components/projects/index.ts` (new file)

## Implementation Guidance
1. Create `src/components/projects/ProjectCard.tsx`
2. Accept `project: Project` prop and optional `className`
3. Use `useTheme()` to retrieve design tokens
4. Style the card with `Card elevation="md"` and NeoPOP border accents
5. Layout the card content logically:
   - Header with category badge and project name
   - Value proposition
   - Why I built it section
   - What I learned section
   - Architecture section
   - Technology tags
   - Action buttons for GitHub and Live Demo (if URLs exist)
6. Create `src/components/projects/index.ts` exporting `ProjectCard`

## Acceptance Criteria
- [ ] `ProjectCard` component renders name, value proposition, category, technologies, whyBuilt, whatLearned, architecture, and GitHub/demo links (when available)
- [ ] Uses design tokens and NeoPOP-inspired card styling
- [ ] Theme switching (light/dark mode) works seamlessly
- [ ] External links open in new tab with rel="noopener noreferrer"
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

## Security / Privacy Considerations
- Component only renders structured data; no dangerous HTML or unescaped strings.
- External links should include rel="noopener noreferrer" for security.

## Performance / Accessibility Considerations
- Semantic HTML tags, clear visual contrast, focusable links, and clean React rendering without redundant state.

## Definition of Done
- `ProjectCard` component created, styled, and exported.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §17: Project Card structure
- PRD §117: Milestone 8 — Projects
- PRD §20: GitHub Integration (for githubUrl field)