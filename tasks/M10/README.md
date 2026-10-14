# Milestone M10 – Resume

## Objective

Create an interactive resume component that displays Ankit's professional resume in an engaging, accessible format, including summary, experience, skills, education, certifications, and achievements, with a PDF download option.

## Context

This milestone builds upon the data models defined in M10.01 (education, certifications, skills) and reuses existing data models for achievements, career timeline (experience), and summary copy. The resume will be accessible at the `/resume` route and will complement the existing PDF resume link in the hero section.

## Execution Order

Recommended implementation order:
1. M10.02: Create resume page route and layout
2. M10.03: Create resume summary component and integrate summary data
3. M10.04: Create resume experience component and integrate experience data (from career timeline)
4. M10.05: Create resume skills component and integrate skills data
5. M10.06: Create resume education component and integrate education data
6. M10.07: Create resume certifications component and integrate certifications data
7. M10.08: Create resume achievements component and integrate achievements data
8. M10.09: Add PDF download button and link
9. M10.10: Ensure responsiveness, accessibility, and phone number redaction
10. M10.11: Add animations and final polishing

Tasks can be executed in this order, though some may be done in parallel (e.g., education, certifications, skills components can be worked on simultaneously after the page layout is ready).

## Traceability Table

| Requirement | Source | Task | Status |
|---|---|---|---|
| Interactive resume component (summary, experience, skills, education, certifications, achievements) | PRD §22, ROADMAP Milestone 10 | M10.03-M10.08 | Covered |
| PDF viewer/link and download button | PRD §22, ROADMAP Milestone 10 | M10.09 | Covered |
| Ensure phone number is redacted | PRD §22, ROADMAP Milestone 10 | M10.10 | Covered |
| Resume accessible at /resume route | Navigation items in src/data/navigationItems.ts | M10.02 | Covered |