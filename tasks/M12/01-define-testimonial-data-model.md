# M12.01 — Define testimonial data model and create testimonial data

## Objective

Define a TypeScript interface for testimonial data and create an empty data file that will be populated with real testimonials when available. This ensures type safety and prepares for future data population without fabricating testimonials.

## Context

The testimonials data model needs to capture the essential information for each endorsement: the quote text, the person's name, their role/company, and optionally a profile URL for attribution. Following the pattern established in other data files (e.g., `src/data/achievements.ts`), we'll create a strongly typed interface and an empty array to start.

## Requirements

- Create a `Testimonial` interface with appropriate fields
- Create a `testimonials.ts` file in `src/data/`
- Export the interface and an empty array of testimonials
- Include clear comments about not fabricating testimonials
- Follow the same commenting pattern as other data files
- Ensure the data file is importable and usable by components

## Scope

### In scope

- `src/data/testimonials.ts` file with:
  - `Testimonial` interface definition
  - `testimonials` array (initially empty)
  - JSDoc comments explaining the data model and warnings against fabrication
- Type definitions that align with PRD §25 and ROADMAP Milestone 12 requirements

### Out of scope

- Populating with actual testimonial data (will be done later when real testimonials are available)
- Creating components that use this data (handled in subsequent tasks)
- Validation or processing of testimonial data

## Dependencies

- None (foundational task)

## Files / Areas Expected To Change

- `src/data/testimonials.ts` (new file)

## Implementation Guidance

1. Create `src/data/testimonials.ts`
2. Define the `Testimonial` interface with fields:
   - `id`: string (unique identifier)
   - `quote`: string (the testimonial text)
   - `name`: string (person's name)
   - `role`: string (person's role or position)
   - `company`: string (company name)
   - `profileUrl`: string (optional URL to LinkedIn, personal site, etc.)
3. Export a `TestimonialsData` type alias for `Testimonial[]`
4. Initialize an empty `testimonials` array of type `TestimonialsData`
5. Add comments similar to those in `src/data/achievements.ts`:
   - Explain the data model source (PRD §25, ROADMAP Milestone 12)
   - Warning: "Do not invent professional information or metrics."
   - Note: "Full verified data population will be completed when real testimonials are available."
6. Ensure proper TypeScript syntax and export statements

## Acceptance Criteria

- [ ] `src/data/testimonials.ts` file exists and is valid TypeScript
- [ ] `Testimonial` interface is properly defined with required fields
- [ ] `testimonials` array is exported and initialized as empty
- [ ] File includes appropriate comments about not fabricating testimonials
- [ ] No lint or TypeScript errors in the new file
- [ ] The file can be imported without errors in other modules

## Testing Requirements

- Run `npm run typecheck` to verify no TypeScript errors
- Run `npm run lint` to verify no linting errors
- Verify the file builds successfully

## Security / Privacy Considerations

- Ensure no personal data is fabricated
- The empty array ensures no false information is presented
- When real testimonials are added later, they must comply with privacy guidelines (only public professional information)

## Performance / Accessibility Considerations

- Minimal impact: empty array adds negligible bundle size
- No accessibility concerns at this stage

## Definition of Done

- The testimonial data model is correctly defined and type-safe
- The data file is ready for component consumption
- No false or fabricated data is present
- All acceptance criteria are met

## Related Requirements

- PRD §25: Testimonials / Social Proof
- ROADMAP Milestone 12: Testimonials