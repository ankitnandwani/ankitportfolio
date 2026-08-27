# M05.01 — Define professional snapshot data model

## Objective

Create TypeScript interfaces and data structures for the professional snapshot metrics that will be displayed on the homepage. These structures should be designed to hold factual professional information sourced from the resume or other verified professional profiles, without inventing any details.

## Context

The professional snapshot section (Milestone 5) follows the hero section (Milestone 4) and provides recruiters with a quick understanding of Ankit's professional profile in seconds. According to PRD §11, this section includes metric cards for:
- Years of engineering experience
- Multi-domain experience (e.g., E-commerce, Finance, Insurance, Logistics)
- API + UI + Mobile automation experience
- Cloud + CI/CD production engineering practices

The exact experience number must be configurable and validated against the current resume before launch.

## Requirements

- Define TypeScript interfaces for professional snapshot data that accurately reflect the metric categories mentioned in PRD §11
- Ensure data structures are extensible for future additions
- Create a data file (e.g., src/data/professionalSnapshot.ts) that exports the structured data
- Data structures should not contain any invented professional information; placeholder values should be clearly marked as such and intended to be replaced with verified data from the resume
- The data model should support validation against the resume (e.g., via a build-time check or manual validation process)

## Scope

### In scope
- TypeScript interfaces for professional snapshot metrics
- Data file exporting structured data for:
  * Engineering experience (years)
  * Domains (list of domain names)
  * Automation experience (API/UI/Mobile)
  * Cloud/CI-CD practices
- Placeholder data with clear comments indicating values must be verified against resume
- Export format suitable for consumption by React components

### Out of scope
- Fetching or parsing the actual resume (PDF or other format)
- Validating data against resume via automated checks (this may be a separate task)
- UI components that display the data
- Styling or layout of the professional snapshot section
- Content for summary copy or capability areas

## Dependencies
- None (foundational data modeling task)

## Files / Areas Expected To Change
- src/data/professionalSnapshot.ts (new file)
- Potential updates to existing imports if any

## Implementation Guidance
1. Create src/data/professionalSnapshot.ts file
2. Define interfaces for each metric category and an overall professional snapshot type
3. Export a constant object containing placeholder data with clear comments
4. Use descriptive field names that match the PRD terminology
5. Ensure TypeScript strict mode is maintained
6. Add JSDoc comments to explain the purpose and data source requirements
7. Do not invent professional information; use obvious placeholders like 0, empty arrays, or strings like "TO_BE_VERIFIED_AGAINST_RESUME"

## Acceptance Criteria
- [ ] src/data/professionalSnapshot.ts file created with proper TypeScript interfaces
- [ ] Data structure includes fields for: yearsExperience, domains, automationExperience, cloudCIDPractices
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
- TypeScript interfaces defined for professional snapshot data
- Data file created and exported
- Placeholder data clearly marked as requiring verification against resume
- No invented professional information included
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §11: Professional Snapshot - metric cards for years experience, multi-domain, automation experience, cloud/CI-CD
- PRD: "The exact experience number must be configurable and should be validated against the current resume before launch."