# M06.04 — Populate career timeline data from resume

## Objective

Create a data file containing Ankit's career history entries sourced from his resume, ensuring all information is factual and verified. Use placeholder data where verification is pending, clearly marked as such.

## Context

The career timeline data must be accurate and truthful, reflecting Ankit's actual professional experience. According to PRD §13, the website should use the resume as the baseline source of truth. We will create a TypeScript file that exports an array of career timeline entries, each matching the interface defined in M06.01.

## Requirements

- Create a data file `src/data/careerTimeline.ts` (if not already created by M06.01, otherwise update it)
- Export a constant array `careerTimeline` containing objects that match the timeline entry interface
- Fill in data for each professional position based on the resume (public/resume.pdf)
- For any information that cannot be verified or is pending confirmation, use clearly marked placeholder values (e.g., "TO_BE_VERIFIED", null, empty array) and add a comment indicating it needs verification
- Do not invent any company names, role titles, dates, responsibilities, technologies, or projects
- Ensure the data is in reverse chronological order (most recent first)
- Include all relevant positions from the resume
- Add JSDoc comments describing the data source and verification status

## Scope

### In scope
- Data file with career timeline entries
- Accurate information from the resume for each position
- Placeholder markers for unverified information
- Reverse chronological order
- Export format for consumption by the timeline container

### Out of scope
- Fetching or parsing the resume PDF programmatically (manual entry is acceptable)
- Validating data against resume via automated checks (could be a separate task)
- UI components that display the data
- Styling or layout of the career timeline section
- Interactive behavior

## Dependencies
- M06.01 – Define career timeline data model (interface must exist)

## Files / Areas Expected To Change
- src/data/careerTimeline.ts (create or update)

## Implementation Guidance
1. Open the resume PDF (public/resume.pdf) and read the professional experience section
2. For each position, create an object with the following fields:
   - company: string (verified company name)
   - role: string (verified job title)
   - startDate: string (e.g., "2021-01" or "Jan 2021") – use a consistent format
   - endDate: string or null for present positions
   - domain: string (industry/domain, e.g., "Logistics", "Finance")
   - responsibilities: string[] (key responsibilities from resume)
   - technologies: string[] (technologies mentioned for that role)
   - notableProjects: string[] (notable projects or achievements, if any)
3. If any field is uncertain, set it to a placeholder value and add a TODO comment
4. Ensure the array is sorted from most recent to oldest
5. Add a JSDoc comment at the top of the file stating the data source (resume.pdf) and that placeholders must be replaced with verified values
6. Do not include any information not present in the resume
7. Follow the existing code style (e.g., similar to src/data/professionalSnapshot.ts)
8. Export the array as `export const careerTimeline = [...]`

## Acceptance Criteria
- [ ] src/data/careerTimeline.ts file created or updated
- [ ] Contains an array of career timeline entries matching the interface from M06.01
- [ ] Data is sourced from the resume (public/resume.pdf) and is factual
- [ ] Placeholder values are clearly marked and commented as needing verification
- [ ] No invented professional information is present
- [ ] Data is in reverse chronological order
- [ ] TypeScript compiles without errors
- [ ] Code follows existing code style and conventions in the repository

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced
- [ ] Data can be imported and used by the timeline container component

## Security / Privacy Considerations
- Ensure no personal identifiable information (PII) beyond what is already public in the resume is included
- The resume itself is public (via /resume.pdf), so sharing the same information in the data file is acceptable
- Do not include any private information not already in the public resume

## Performance / Accessibility Considerations
- Data file size is negligible
- No performance impact

## Definition of Done
- Career timeline data file populated with resume-sourced information
- Placeholder values clearly marked for verification
- No invented information included
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §13: Career Timeline - use resume as baseline source of truth
- PRD: "The website should use the resume as the baseline source of truth."