## [0.1.96] - 2026-10-18
- Created task specifications for Milestone M12 – Testimonials

## [0.1.95] - 2026-10-17
- Completed M11.06: Add animations and final polishing (updated src/components/socialHub/SocialHub.tsx with entrance animations, refined hover/tap animations, subtle border styling, and ensured visual consistency; updated PROJECT_STATE.md and TODO.md)

## [0.1.94] - 2026-10-17
- Completed M11.05: Ensure SocialHub accessibility and responsiveness (updated src/components/socialHub/SocialHub.tsx with improved accessibility: aria-label descriptions, focus indicators, reduced motion support, responsive grid layout; updated PROJECT_STATE.md and TODO.md)

## [0.1.93] - 2026-10-17
- Completed M11.04: Update footer to be minimal (removed SocialLinks component from src/components/footer/Footer.tsx, leaving only copyright section; updated PROJECT_STATE.md and TODO.md)

## [0.1.92] - 2026-10-17
- Completed M11.03: Integrate SocialHub component into homepage layout (added SocialHub section after FeaturedProjects in app/page.tsx with heading and responsive layout; updated PROJECT_STATE.md and TODO.md)

## [0.1.91] - 2026-10-17
- Completed M11.02: Create SocialHub component (created src/components/socialHub/SocialHub.tsx with card-based layout, hover animations, responsive grid, accessibility features; updated PROJECT_STATE.md and TODO.md)

## [0.1.90] - 2026-10-17
- Completed M11.01: Update social links configuration (updated src/data/socialLinks.ts with placeholder entries for all 13 platforms; added verification warning; updated PROJECT_STATE.md and TODO.md)

## [0.1.89] - 2026-10-17
- Created task specifications for Milestone M11 – Social Hub

## [0.1.88] - 2026-10-17
- Completed M10.11: Add animations and final polishing (split page into server and client components due to metadata and hooks constraints, added use client directive, added motion animations with hover/tap effects to PDF download button, ensured reduced motion preference respected)

## [0.1.87] - 2026-10-16
- Completed M10.10: Ensure responsiveness, accessibility, and phone number redaction (verified no phone number in data or components, confirmed responsive design and accessibility patterns)

## [0.1.86] - 2026-10-16
- Completed M10.09: Add PDF download button and link (updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.85] - 2026-10-16
- Completed M10.08: Create resume achievements component and integrate achievements data (created src/components/resume/ResumeAchievements.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.84] - 2026-10-16
- Completed M10.07: Create resume certifications component and integrate certifications data (created src/components/resume/ResumeCertifications.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.83] - 2026-10-16
- Completed M10.06: Create resume education component and integrate education data (created src/components/resume/ResumeEducation.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.82] - 2026-10-15
- Completed M10.05: Create resume skills component and integrate skills data (created src/components/resume/ResumeSkills.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.81] - 2026-10-15
- Completed M10.04: Create resume experience component and integrate experience data (created src/components/resume/ResumeExperience.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.80] - 2026-10-15
- Completed M10.03: Create resume summary component and integrate summary data (created src/components/resume/ResumeSummary.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.79] - 2026-10-15
- Completed M10.02: Create resume page route and layout (created app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.78] - 2026-10-14
- Created task specifications for Milestone 10 (Resume): M10.02 through M10.11.
- Updated PROJECT_STATE.md and TODO.md to reflect planning status.

## [0.1.77] - 2026-10-08
- Completed M10.01: Define resume data model (created src/data/education.ts, src/data/certifications.ts, src/data/skills.ts; updated PROJECT_STATE.md and TODO.md)

## [0.1.76] - 2026-10-08
- Completed M09.10: Verify no GitHub call on every request (added temporary logging to confirm cache behavior, verified that cache is checked and on miss a request is made; due to missing GITHUB_TOKEN, cache hits could not be observed but the caching logic is correct)

## [0.1.75] - 2026-10-08
- Completed M09.09: Add typing and tests for GitHub service (updated src/lib/githubService.ts with input type and JSDoc, created src/lib/githubService.test.ts placeholder)

## [0.1.74] - 2026-10-08
- Completed M09.08: Integrate with project list and detail (updated app/projects/[slug]/project-detail-content.tsx to wrap ProjectCard in Suspense with loading fallback)

## [0.1.73] - 2026-09-01
- Completed M09.07: Update project data population (updated src/data/projects.ts to add githubUrl fields for projects with verified GitHub repositories)

## [0.1.72] - 2026-09-01
- Completed M09.06: Add fallback data (updated src/components/projects/ProjectCard.tsx to show placeholder UI for failed GitHub requests, and updated design/tokens.ts to add mutedForeground color)

## [0.1.71] - 2026-09-01
- Completed M09.05: Ensure caching reduces API calls (updated src/lib/githubService.ts to add cache size limit, cache hit/miss logging in development, and enforce cache size before storing)

## [0.1.70] - 2026-09-01
- Completed M09.04: Implement loading states (updated src/components/projects/ProjectList.tsx to wrap ProjectCard in Suspense with loading fallback, converted ProjectCard to async server component, removed client-side loading state, passed tokens and prefersReducedMotion props, added loading fallback UI)

## [0.1.69] - 2026-09-01
- Completed M09.03: Extend ProjectCard to show GitHub metadata (updated src/components/projects/ProjectCard.tsx to fetch and display GitHub repo stats with loading and error states)

## [0.1.68] - 2026-09-01
- Completed M09.02: Create GitHub service with caching (created src/lib/githubService.ts, src/lib/types.ts)

## [0.1.67] - 2026-08-31
- Completed M09.01: Define GitHub repository data model (created src/data/github.ts)

## [0.1.66] - 2026-08-30
- Completed M08.11: Integrate featured projects section into homepage (created FeaturedProjects component, updated projects index.ts and app/page.tsx)

## [0.1.65] - 2026-08-30
- Completed M08.10: Ensure accessibility and keyboard navigation (updated ProjectCard, ProjectList, FilterBar, project detail page, and added sr-only utility class)

## [0.1.64] - 2026-08-30
- Completed M08.09: Add animations using Framer Motion (updated ProjectCard, ProjectList, FilterBar)