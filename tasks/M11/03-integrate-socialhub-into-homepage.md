# M11.03 — Integrate SocialHub component into homepage layout

## Objective

Integrate the SocialHub component into the homepage layout at an appropriate location, following the homepage structure outlined in the PRD (e.g., after Engineering Philosophy or before Ask AI). The section should be visually distinct and contribute to the overall narrative of the homepage.

## Context

The homepage currently consists of sections: Hero, ProfessionalSection, AchievementsSection, CareerTimeline, CapabilityAreas, FeaturedProjects. The PRD §9 describes a recommended structure that includes "Engineering Philosophy" and "Social Proof" (testimonials) sections. The Social Hub should be placed in a logical location, possibly after Engineering Philosophy and before Social Proof (testimonials) or after Featured Projects. This task integrates the SocialHub component into `app/page.tsx`.

## Requirements

- Import the SocialHub component in `app/page.tsx`.
- Add the SocialHub section to the homepage JSX, placed in a logical order according to the PRD homepage structure.
- Provide a section heading (e.g., "Social Hub" or "Connect") above the component, following the typography and styling patterns of other section headings.
- Ensure the section uses the same container and layout patterns as other sections (e.g., wrapped in a container with appropriate margins and padding).
- The section should be responsive and maintain consistent spacing with adjacent sections.
- Do not alter the existing sections unless necessary for integration (preserve existing functionality).
- Ensure the homepage continues to build and run without errors.

## Scope

### In scope
- Adding the SocialHub section to `app/page.tsx`.
- Adding a section heading (if appropriate) using existing heading styles.
- Ensuring proper spacing and layout.

### Out of scope
- Creating the SocialHub component (handled in M11.02).
- Updating the social links configuration (handled in M11.01).
- Updating the footer (handled in M11.04).
- Creating new sections like Engineering Philosophy or Social Proof (testimonials) if they don't exist (those may be separate milestones).

## Dependencies
- M11.02: Create SocialHub component (must be completed first).
- Existing homepage layout in `app/page.tsx`.

## Files / Areas Expected To Change
- `app/page.tsx` – to be updated with the import and JSX for the SocialHub section.

## Implementation Guidance
1. Open `app/page.tsx`.
2. Import the SocialHub component: `import { SocialHub } from '@/src/components/socialHub/SocialHub';` (adjust path if needed).
3. Determine the appropriate location for the SocialHub section. Based on the PRD §9 homepage structure:
   ```
   Hero
   ↓
   Professional Snapshot
   ↓
   Selected Impact
   ↓
   Career Journey
   ↓
   Engineering Arsenal
   ↓
   Featured Projects
   ↓
   Finance / Trading Lab
   ↓
   Engineering Philosophy
   ↓
   Social Proof
   ↓
   Ask Ankit's AI
   ↓
   Resume CTA
   ↓
   Contact
   ```
   Currently implemented sections: Hero, ProfessionalSection (Professional Snapshot?), AchievementsSection (Selected Impact?), CareerTimeline (Career Journey?), CapabilityAreas (Engineering Arsenal?), FeaturedProjects (Featured Projects). Missing: Finance/Trading Lab, Engineering Philosophy, Social Proof, Ask AI, Resume CTA, Contact.
   However, we have not yet implemented those sections. The Social Hub could be placed after CapabilityAreas and before FeaturedProjects, or after FeaturedProjects. To avoid conflict with future milestones, we can place it after FeaturedProjects and before the end of main content, with a comment indicating where future sections may go.
   Alternatively, we can place it after CapabilityAreas (Engineering Arsenal) as a placeholder for "Social Hub".
   Let's examine the current `app/page.tsx` to see the order:
   ```
   <Hero />
   <ProfessionalSection />
   <AchievementsSection />
   <CareerTimeline />
   <CapabilityAreas />
   <FeaturedProjects />
   ```
   We can insert SocialHub after CapabilityAreas and before FeaturedProjects, or after FeaturedProjects. Since the PRD mentions "Engineering Philosophy" after Featured Projects, and Social Hub might be after that, we don't have Engineering Philosophy yet. To be safe, we can place SocialHub after FeaturedProjects and add a comment for future sections.
   However, we need to decide based on the actual implementation. Let's check if there is an Engineering Philosophy component somewhere. Search for "philosophy".
4. After deciding the location, add the JSX:
   ```typescript
   <section className="mt-16">
     <h2 className="section-heading">Social Hub</h2>
     <SocialHub className="mt-4" />
   </section>
   ```
   We need to check what heading style is used elsewhere. Look at ProfessionalSection or AchievementsSection for heading patterns.
5. Ensure the section uses appropriate margins (`mt-16` or similar) to match other sections.
6. Save the file and verify that the homepage still loads correctly.

## Acceptance Criteria
- [ ] The SocialHub component is imported in `app/page.tsx`.
- [ ] The SocialHub section is rendered on the homepage.
- [ ] The section appears in the correct visual order (to be determined based on layout).
- [ ] A section heading is present (optional but recommended).
- [ ] The section uses consistent spacing and layout with other sections.
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.
- [ ] The homepage builds successfully for production (`npm run build`).
- [ ] No existing sections are broken or removed.

## Testing Requirements
- [ ] Manual verification: visit the homepage and confirm the SocialHub section is visible.
- [ ] Check that the section is responsive and maintains layout on different screen sizes.
- [ ] Verify that clicking social links opens the correct URLs (in a new tab).
- [ ] Run `npm run typecheck` to check TypeScript correctness.
- [ ] Run `npm run lint` to check for linting errors.
- [ ] Run `npm run build` to ensure the homepage builds correctly.
- [ ] Run `npm run dev` to verify the homepage loads in development mode.

## Security / Privacy Considerations
- No direct security or privacy implications; only renders static links.

## Performance / Accessibility Considerations
- The section should not cause excessive layout shifts.
- The component should be accessible (as ensured in M11.02).
- The section heading should be properly structured (e.g., using `<h2>` if it's a subsection).

## Definition of Done
- The SocialHub component is successfully integrated into the homepage layout.
- The task is ready for the next task (M11.04) to depend on it.

## Related Requirements
- PRD §9: Homepage structure — sections order.
- PRD §21: Social Hub — Create one elegant social section rather than placing 15 icons in the footer.
- ROADMAP Milestone 11: Social Hub — Social cards for LinkedIn, GitHub, X, Medium, Stack Overflow, Telegram, Discord, Instagram, Quora, Facebook, LeetCode, Codewars, Resume.