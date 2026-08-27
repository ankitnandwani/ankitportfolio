# M06.01 — Define career timeline data model

## Objective

Create TypeScript interfaces and data structures for the career timeline entries that will be displayed in the interactive timeline. These structures should hold factual professional experience information sourced from the resume or other verified professional profiles, without inventing any details.

## Context

The career timeline section (Milestone 6) follows the professional snapshot section (Milestone 5) and provides recruiters with an interactive browsable career history. According to PRD §13, the timeline should show positions with company, role, dates, domain, key responsibilities, major technologies, and notable projects. Each position should expand into details.

The website should use the resume as the baseline source of truth.

## Requirements

- Define TypeScript interfaces for career timeline entries that accurately reflect the information needed for each position
- Ensure data structures are extensible for future additions (e.g., adding notable projects)
- Create a data file (e.g., src/data/careerTimeline.ts) that exports the structured data for all positions
- Data structures should not contain any invented professional information; placeholder values should be clearly marked as such and intended to be replaced with verified data from the resume
- The data model should support validation against the resume (e.g., via a build-time check or manual validation process)

## Scope

### In scope
- TypeScript interfaces for career timeline entries (company, role, startDate, endDate, domain, responsibilities, technologies, notableProjects)
- Data file exporting an array of timeline entries in chronological order (most recent first)
- Placeholder data with clear comments indicating values must be verified against resume
- Export format suitable for consumption by React components

### Out of scope
- Fetching or parsing the actual resume (PDF or other format)
- Validating data against resume via automated checks (this may be a separate task)
- UI components that display the timeline
- Styling or layout of the career timeline section
- Interactive behavior (expand/collapse, animations)

## Dependencies
- None (foundational data modeling task)

## Files / Areas Expected To Change
- src/data/careerTimeline.ts (new file)
- Potential updates to existing imports if any

## Implementation Guidance
1. Create src/data/careerTimeline.ts file
2. Define an interface for a single timeline entry with appropriate fields
3. Define an array type for the timeline
4. Export a constant object containing placeholder data with clear comments
5. Use descriptive field names that match the PRD terminology
6. Ensure TypeScript strict mode is maintained
7. Add JSDoc comments to explain the purpose and data source requirements
8. Do not invent professional information; use obvious placeholders like empty arrays, null dates, or strings like "TO_BE_VERIFIED_AGAINST_RESUME"

## Acceptance Criteria
- [ ] src/data/careerTimeline.ts file created with proper TypeScript interfaces
- [ ] Data structure includes fields for: company, role, startDate, endDate, domain, responsibilities (array of strings), technologies (array of strings), notableProjects (array of strings or objects)
- [ ] Placeholder data is clearly marked as unverified and must be replaced with resume-validated values
- [ ] No invented professional information is present in the data
- [ ] TypeScript compiles without errors
- [ ] Code follows existing code style and conventions in the repository

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced

## Security / Privacy Considerations
- No security or privacy concerns as this task only involves data structure definitions
- Ensure no personal identifiable information (PII) is invented or included in placeholder data

## Performance / Accessibility Considerations
- No direct performance or accessibility impact as this is a data definition task
- Structures should be lightweight and serializable if needed

## Definition of Done
- TypeScript interfaces defined for career timeline data
- Data file created and exported
- Placeholder data clearly marked as requiring verification against resume
- No invented professional information included
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §13: Career Timeline - interactive timeline with company cards showing role, dates, domain, responsibilities, technologies, notable projects
- PRD: "The website should use the resume as the baseline source of truth."