# M08.02 — Populate project data from resume

## Objective

Populate `src/data/projects.ts` with factual, verified project records based on Ankit's professional experience, personal engineering projects, and approved project descriptions without inventing unverified claims.

## Context

PRD §16 emphasizes that projects should be based on real work: "Create three categories: Professional Engineering, Personal Engineering, Engineering Lab." The baseline source of truth is the professional resume, personal project descriptions, and PRD examples (CCGeek, automation tools, backtesting engines, AI applications, developer tools, options automation, market-data systems, etc.).

## Requirements

- Populate `projectsData` in `src/data/projects.ts` with structured entries
- Include representative projects across all three categories:
  * Professional Engineering: projects/work directly related to professional engineering experience
  * Personal Engineering: projects such as CCGeek, automation tools, backtesting engines, AI applications, developer tools
  * Engineering Lab: experimental projects
  * Finance: options automation, market-data systems, backtesting, trading strategy engines
  * AI: AI-assisted development tools, LLM applications, prompt engineering projects
- For each entry, provide authentic details:
  * `id`: unique kebab-case slug
  * `name`: concise project name
  * `valueProposition`: one-line description of what the project does
  * `category`: appropriate category from the defined set
  * `technologies`: list of relevant technologies used
  * `whyBuilt`: motivation and context for creating the project
  * `whatLearned`: key skills, insights, or experiences gained
  * `architecture`: high-level architectural overview or key technical decisions
  * `githubUrl`: URL to public GitHub repository (if applicable)
  * `demoUrl`: URL to live demo or deployment (if applicable)
  * `featured`: boolean flag for homepage prominence (selectively applied)
- Maintain absolute accuracy; avoid inventing technologies or false claims

## Scope

### In scope
- Curating and populating verified project items in `src/data/projects.ts`
- Clear documentation for each entry with source attribution

### Out of scope
- UI component implementation (handled in M08.03, M08.04)
- Dynamic GitHub data fetching (handled in Milestone 9)
- Project detail page content beyond static data (handled in M08.06)

## Dependencies
- M08.01 – Define project data model (data interface must exist)

## Files / Areas Expected To Change
- `src/data/projects.ts`

## Implementation Guidance
1. Review PRD §16 examples:
   * Professional Engineering: projects related to work at DP World, Persistent Systems, etc.
   * Personal Engineering: CCGeek, automation tools, backtesting engines
   * Engineering Lab: unusual experiments
   * Finance: options automation, market-data systems
   * AI: AI applications, developer tools
2. Populate authentic items corresponding to real projects
3. Ensure all fields are populated with descriptive text and appropriate technology tags
4. Mark featured items appropriately for homepage display
5. Verify GitHub URLs point to public repositories

## Acceptance Criteria
- [ ] `src/data/projects.ts` exports an array of populated, factual project entries
- [ ] Each entry has non-empty values for required fields (`id`, `name`, `valueProposition`, `category`, `technologies`, `whyBuilt`, `whatLearned`, `architecture`)
- [ ] `category` values are valid (Professional, Personal Engineering, Engineering Lab, Finance, AI)
- [ ] No fabricated technologies or false claims are included
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

## Security / Privacy Considerations
- Ensure no confidential client information, proprietary secrets, or personal contact info are exposed.
- GitHub URLs must point to public repositories only.
- Avoid revealing unpublished personal projects without permission.

## Performance / Accessibility Considerations
- Clean JSON/TypeScript object with low memory footprint.

## Definition of Done
- Factual projects dataset populated in `src/data/projects.ts`.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §16: Projects
- PRD §17: Project Card
- PRD §20: GitHub Integration
- PRD §117: Milestone 8 — Projects