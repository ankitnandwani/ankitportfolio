# M05.03 — Add summary copy section

## Objective

Create a section for summary copy that provides a brief, recruiter-oriented professional summary beneath the metric cards in the professional snapshot section. This summary should highlight Ankit's professional positioning without inventing any information.

## Context

After the metric cards that show quantitative and categorical information, the professional snapshot section needs a brief narrative summary to provide context and highlight key professional strengths. According to PRD §11, this includes "Summary copy." The summary should be written in a tone appropriate for recruiters and hiring managers, focusing on factual professional information that can be verified against the resume.

## Requirements
- Create a summary copy component or section that displays a professional summary paragraph
- The summary should be recruiter-oriented, focusing on:
  * Seniority level
  * Key specializations (SDET, Automation Engineering)
  * Breadth across domains (backend, cloud, CI/CD, AI)
  * Engineering mindset and philosophy
- Text content must not invent professional information; should be based on verified resume content
- Use appropriate typography from the design system (body font, readable sizing)
- Ensure the section flows well visually after the metric cards
- Make the summary copy configurable or editable via data (not hard-coded)
- Follow the visual language: premium, bold, minimal, technical
- Ensure accessibility and readability

## Scope

### In scope
- SummaryCopy React component (src/components/summaryCopy/index.tsx)
- Data structure for summary copy text (could be part of professional snapshot data or separate)
- Typography styling using design system tokens
- Responsive behavior (appropriate line lengths, spacing on mobile/desktop)
- Export from index.ts for easy import
- Clear separation between data and presentation

### Out of scope
- Creating the actual summary copy text (this should come from verified resume/content)
- Metric cards component (M05.02)
- Capability areas section (M05.04)
- Integration into homepage layout (M05.05)
- Data validation against resume
- Inventing or creating fictional professional summaries

## Dependencies
- M05.01: Define professional snapshot data model (for potential integration)
- M05.02: Create ProfessionalSnapshot component (recommended order, but can work in parallel if data structures are ready)
- Design system typography tokens

## Files / Areas Expected To Change
- src/components/summaryCopy/index.tsx (new file)
- src/components/summaryCopy/index.ts (new file)
- Potential updates to professional snapshot data model if summary is included there
- Potential updates to src/components/index.ts if barrel exports are used

## Implementation Guidance
1. Create src/components/summaryCopy directory
2. Create index.tsx with the SummaryCopy component
3. Create index.ts export file
4. Determine where summary copy text will come from:
   * Option 1: Extend professional snapshot data model to include summary field
   * Option 2: Create separate data file for summary copy
   * Option 3: Accept summary as a prop to the component
5. For this task, create the component to accept summary text as a prop (most flexible)
6. Use appropriate heading or paragraph semantics:
   * Consider using a <p> tag with body text styling
   * Or a <section> with a heading if appropriate
7. Apply typography from design system tokens:
   * Font family: Inter, system-ui, sans-serif
   * Font size: base or lg for readability
   * Font weight: regular or medium
   * Line height: relaxed or loose for readability
8. Ensure proper spacing and alignment with the metric cards above
9. Implement responsive behavior:
   * On desktop: potentially wider container with centered text
   * On mobile: full-width with appropriate padding
10. Follow accessibility guidelines:
    * Sufficient color contrast between text and background
    * Readable font sizes (minimum 16px equivalent)
    * Proper line length (45-75 characters ideal)
11. Do not invent professional summary text; use placeholder text that makes it clear it needs to be replaced with verified content

## Acceptance Criteria
- [ ] src/components/summaryCopy/index.tsx file created
- [ ] SummaryCopy component accepts summary text as a prop
- [ ] Component uses design system typography for body text
- [ ] Responsive layout works on mobile and desktop
- [ ] No invented professional information is displayed (will show placeholder text)
- [ ] TypeScript compiles without errors
- [ ] Lint passes
- [ ] Component can be imported and used in other files

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced

## Security / Privacy Considerations
- No security concerns as component only displays provided text
- Ensure no PII is included in placeholder summary text
- Component should not perform any processing that could invent information

## Performance / Accessibility Considerations
- [ ] Component should be lightweight
- [ ] Accessibility:
   * Color contrast ratio >= 4.5:1 for normal text
   * Font size >= 16px equivalent for body text
   * Line height >= 1.5 for readability
   * Line length <= 75 characters for optimal readability
   * Support for user-scaled text (relative units)

## Definition of Done
- SummaryCopy component created and exported
- Component accepts summary text as prop and displays it with proper typography
- Responsive layout implemented
- TypeScript and lint checks pass
- No invented professional information in component
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §11: Professional Snapshot - summary copy
- PRD §62: Typography - body font for readable content
- PRD §3.1: Beautiful + useful - visual design should enhance comprehension
- PRD §71: Accessibility target WCAG 2.2 AA
- PRD §3.4: Expressive but honest - content must remain factual