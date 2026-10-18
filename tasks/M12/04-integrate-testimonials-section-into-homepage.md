# M12.04 — Integrate testimonials section into homepage layout

## Objective

Integrate the testimonials section component into the homepage layout (`app/page.tsx`) after the Social Hub section, following the information architecture outlined in PRD §9. The testimonials section should appear as a distinct section on the homepage, maintaining visual and structural consistency with other sections.

## Context

The homepage currently consists of: Hero, ProfessionalSection, AchievementsSection, CareerTimeline, CapabilityAreas, FeaturedProjects, and SocialHub. According to the PRD's recommended structure, after Social Hub comes "Engineering Philosophy" (future milestone) and then "Ask Ankit's AI". However, since testimonials is the next milestone, we'll place it after Social Hub and before any future sections. This maintains a logical flow: hero → snapshot → achievements → timeline → capabilities → featured projects → social proof → (future: engineering philosophy) → AI assistant.

## Requirements

- Modify `app/page.tsx` to import the `TestimonialsSection` component
- Place the `<TestimonialsSection />` component after the `<SocialHub />` section
- Ensure proper spacing and consistency with other sections (use similar margin-top values, e.g., `mt-16`)
- Do not modify existing sections or their order
- Ensure the integration does not break existing layout or functionality
- The testimonials section should be hidden automatically when there are no testimonials (handled by the component itself)

## Scope

### In scope

- `app/page.tsx`: import statement and placement of `<TestimonialsSection />`

### Out of scope

- Modifying the testimonials section component itself (handled in M12.03)
- Adding any additional wrapper elements or containers beyond what's needed
- Changing the order of existing sections

## Dependencies

- M12.03: TestimonialsSection component must exist
- M12.01 and M12.02: Testimonial data and card component must exist (for the section to work)

## Files / Areas Expected To Change

- `app/page.tsx`

## Implementation Guidance

1. Open `app/page.tsx`
2. After the existing import statements, add: `import { TestimonialsSection } from '@/src/components/testimonials/TestimonialsSection'`
3. In the JSX, after the `<SocialHub />` section's closing tag, add:
   ```jsx
   <TestimonialsSection className="mt-16" />
   ```
   Note: Use the same `mt-16` margin-top as other sections for consistency.
4. Save the file
5. Verify that the indentation and formatting are consistent with the rest of the file

## Acceptance Criteria

- [ ] `app/page.tsx` imports `TestimonialsSection` correctly
- [ ] `<TestimonialsSection />` component is placed after `<SocialHub />`
- [ ] The component receives a `className="mt-16"` prop for consistent spacing
- [ ] No syntax errors in the modified file
- [ ] The existing layout and functionality of other sections remains unchanged
- [ ] The homepage builds successfully

## Testing Requirements

- Run `npm run dev` or `next dev` to verify the homepage loads without errors
- Run `npm run lint` to verify no linting errors
- Run `npm run typecheck` to verify no TypeScript errors
- Visually inspect that the section is not visible when testimonials array is empty (should be hidden)
- Optionally, temporarily add a placeholder testimonial to verify the section appears (ensure placeholder data is not committed)

## Security / Privacy Considerations

- No new considerations; the integration does not introduce privacy risks
- The testimonials section handles its own data privacy concerns

## Performance / Accessibility Considerations

- Minimal performance impact: importing one additional component
- No impact on accessibility beyond what the section component provides
- Maintains existing performance characteristics

## Definition of Done

- The testimonials section is successfully integrated into the homepage layout
- The component appears in the correct position after Social Hub
- All acceptance criteria are met
- The homepage continues to function correctly

## Related Requirements

- PRD §9: Homepage structure (Social Proof section)
- ROADMAP Milestone 12: Testimonials section on homepage