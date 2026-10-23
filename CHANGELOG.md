## [0.1.111] - 2026-10-24
- Store a null embedding instead of an empty array until the embedding has been generated. A pgvector column only accepts a vector with exactly the declared number of dimensions, so the empty array placeholder would have been rejected by the live database on every chunk insert

## [0.1.110] - 2026-10-24
- Corrected the knowledge base migration before its first deployment: switched the vector index from IVFFlat to HNSW (IVFFlat is built from the rows that already exist and would have been created on an empty table), enabled row level security on both knowledge tables so they cannot be read through the public API with the anon key, and documented why the embedding column stays at 768 dimensions
- Corrected the M13.04 task specification, which stated that `gemini-embedding-001` returns 768 dimensions. It returns 3072 by default, so the embedding request has to set the output dimension explicitly
- Added `GEMINI_EMBEDDING_MODEL` to the environment schema so the embedding model is a configuration value rather than a Gemini specific detail in the application code (PRD §49)

## [0.1.109] - 2026-10-23
- Completed M13.03: implemented the document ingestion pipeline (created src/lib/knowledge/ingestion.ts, src/lib/knowledge/markdown.ts, scripts/ingest-knowledge.mts, src/lib/knowledge/testing/fakeSupabase.ts, knowledge/README.md; rewrote src/lib/knowledge/ingestion.ts; updated src/lib/knowledge/pii.ts, src/lib/knowledge/metadata.ts, src/lib/supabase.ts, package.json)
- The pipeline now processes 11 structured knowledge source types plus markdown documents, redacts PII, extracts metadata, stores documents and chunks with referential integrity, and reports ingestion statistics
- Made the pipeline idempotent: a document is identified by its source type and title, so re-running updates only the documents whose content changed, bumps their version and replaces their chunks instead of duplicating the knowledge base
- Added `npm run ingest` to trigger an ingestion run manually
- Fixed the phone number redaction matching ISO dates, which was corrupting the career timeline, education and certification dates in the knowledge base (PRD §37 scopes redaction to phone numbers)
- Fixed social links being classified as PROFESSIONAL instead of PUBLIC (PRD §34)
- Added 20 tests covering the ingestion pipeline end to end, markdown documents and the two fixes, bringing the suite to 64 tests

## [0.1.108] - 2026-10-22
- Wired up a real test suite: `npm test` now runs `node --test` instead of the previous "No tests yet" no-op, so the CI Tests step actually executes tests. Added 44 tests across the GitHub URL parser, the GitHub service, and the M13.03 chunking, PII redaction and metadata modules
- Extracted `parseGitHubUrl` into `src/lib/githubUrl.ts` so the parsing rules can be unit tested in isolation from environment validation, and switched `src/lib/githubService.ts` to explicit `.ts` import specifiers so Node's ESM test runner can load it
- Deleted the placeholder `src/lib/token-test.ts` (a temporary M01.07 design-token scaffold that was not a test and broke the ESM test runner) and replaced the placeholder `src/lib/githubService.test.ts` with a real test suite

## [0.1.107] - 2026-10-21
- Fixed CI lint and typecheck failures introduced with the M13.03 ingestion pipeline: replaced `any` with the real source data model types across `src/lib/knowledge/ingestion.ts` and `src/lib/knowledge/metadata.ts`, added `KnowledgeDocumentInsert`/`KnowledgeChunkInsert` payload types so database-generated `id`/`created_at` columns are no longer written with placeholder values, corrected field names that did not exist in the source data models (certifications, career timeline, social links), removed the unreachable GitHub profile processor, and migrated `.eslintignore` into the ESLint flat config

## [0.1.106] - 2026-10-18
- Completed M13.02: Set Up Supabase Client Wrapper and Environment Validation (updated src/lib/supabase.ts with environment validation and separate anon/service role clients)

## [0.1.105] - 2026-10-18
- Completed M13.01: Define AI Knowledge Base Document Format and Schema (created supabase/migrations/20261018000001_create_knowledge_tables.sql, src/lib/supabase.ts, src/types/knowledge.ts, src/lib/knowledge.schema.ts; installed @supabase/supabase-js)

## [0.1.104] - 2026-10-18
- Created task specifications for Milestone M13 – AI Knowledge Base

## [0.1.103] - 2026-10-18
- Completed M12.07: Add final polishing and verify design consistency (updated src/components/testimonials/TestimonialCard.tsx, src/components/testimonials/TestimonialsSection.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.102] - 2026-10-18
- Completed M12.06: Ensure responsiveness, accessibility, and conditional rendering (updated src/components/testimonials/TestimonialCard.tsx, src/components/testimonials/TestimonialsSection.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.101] - 2026-10-18
- Completed M12.05: Add animations and interactive states (updated src/components/testimonials/TestimonialCard.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.100] - 2026-10-18
- Completed M12.04: Integrate testimonials section into homepage layout (modified app/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.99] - 2026-10-18
- Completed M12.03: Create testimonials section component (created src/components/testimonials/TestimonialsSection.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.98] - 2026-10-18
- Completed M12.02: Create testimonial card component (created src/components/testimonials/TestimonialCard.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.97] - 2026-10-18
- Completed M12.01: Define testimonial data model and create testimonial data (created src/data/testimonials.ts; updated PROJECT_STATE.md and TODO.md)

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
- Completed M10.04: Create resume experience component and integrate experience data (from career timeline) (created src/components/resume/ResumeExperience.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.80] - 2026-10-15
- Completed M10.03: Create resume page route and layout (created app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

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