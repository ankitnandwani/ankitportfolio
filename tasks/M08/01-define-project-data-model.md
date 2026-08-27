# M08.01 — Define project data model

## Objective

Create TypeScript interfaces and types for project entries that represent professional, personal, and engineering-lab projects with clear value propositions and technical details.

## Context

According to PRD §16 and §117, the Projects section showcases engineering projects rather than simple technology lists. Each project needs a well-defined structure capturing the name, value proposition, category, motivation, learning outcomes, architectural highlights, technology stack, and external links (GitHub, live demo).

## Requirements

- Create TypeScript interface `Project` in `src/data/projects.ts` (or `@/src/data/projects.ts`)
- The data structure must include fields:
  * `id`: Unique string identifier (e.g. `ccgeek`)
  * `name`: Concise project name (e.g. "CCGeek")
  * `valueProposition`: One-line description of what the project does or its primary benefit
  * `category`: Project category from `{ "Professional", "Personal Engineering", "Engineering Lab", "Finance", "AI" }`
  * `technologies`: Array of key tools/technologies utilized (e.g. `["Microsoft Graph", "PostgreSQL", "React", "Node.js"]`)
  * `whyBuilt`: Motivation and context for why the project was created
  * `whatLearned`: Key skills, insights, or experiences gained from building the project
  * `architecture`: High-level architectural overview or key technical decisions
  * `githubUrl`: URL to the GitHub repository (optional if not applicable)
  * `demoUrl`: URL to live demo or deployment (optional if not applicable)
  * `featured`: Optional boolean flag indicating if this project should be featured prominently on homepage
- Export type aliases and empty/placeholder data structures with clear TypeScript comments
- Ensure strict TypeScript typing with zero `any` types
- Consider adding optional fields for screenshots, video links, or architecture diagrams if needed later

## Scope

### In scope
- TypeScript interface and type definitions for projects
- Creation of `src/data/projects.ts` scaffold with exported types
- Type safety and strict adherence to TypeScript configuration

### Out of scope
- Populating full verified project content (handled in M08.02)
- UI components and rendering (handled in M08.03, M08.04)
- Styling or animations
- GitHub data fetching (handled in later milestones)

## Dependencies
- None (foundational data modeling task)

## Files / Areas Expected To Change
- `src/data/projects.ts` (new file)

## Implementation Guidance
1. Create `src/data/projects.ts`
2. Define `interface Project` with all required fields
3. Define `type ProjectData = Project[]`
4. Define `type ProjectCategory` as a union of the allowed category strings
5. Export type definitions and an initial typed placeholder structure with clear comments indicating verification requirements
6. Ensure strict typing and JSDoc documentation for each property

## Acceptance Criteria
- [ ] `src/data/projects.ts` defines and exports `Project` interface and `ProjectData` type
- [ ] Interface includes `id`, `name`, `valueProposition`, `category`, `technologies`, `whyBuilt`, `whatLearned`, `architecture`, `githubUrl`, `demoUrl`, and optional `featured`
- [ ] `category` field uses a union type for valid categories
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

## Security / Privacy Considerations
- No private or confidential information included in type definitions or comments.
- GitHub and demo URLs should point to public resources only.

## Performance / Accessibility Considerations
- Plain TypeScript interface with zero runtime bundle overhead.

## Definition of Done
- TypeScript interfaces defined and exported cleanly from `src/data/projects.ts`.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §16: Projects
- PRD §17: Project Card
- PRD §117: Milestone 8 — Projects
- PRD §20: GitHub Integration (for githubUrl field)