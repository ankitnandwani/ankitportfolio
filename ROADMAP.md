# Project Roadmap

*This roadmap translates the requirements in **PRD.md** into ordered milestones, each with concrete tasks, acceptance criteria (Definition of Done), and dependencies.*

---

## Milestone Overview & Dependencies
| Milestone | Name | Depends On |
|-----------|------|------------|
| 0 | Discovery | – |
| 1 | Architecture | 0 |
| 2 | Design System | 1 |
| 3 | Site Shell | 2 |
| 4 | Hero Section | 3 |
| 5 | Professional Snapshot | 4 |
| 6 | Career Timeline | 5 |
| 7 | Achievements | 6 |
| 8 | Projects | 7 |
| 9 | GitHub Integration | 8 |
|10 | Resume | 9 |
|11 | Social Hub |10 |
|12 | Testimonials |11 |
|13 | AI Knowledge Base |12 |
|14 | Gemini Integration |13 |
|15 | AI Guardrails |14 |
|16 | AI Chat UX |15 |
|17 | Job Description Analyzer |16 |
|18 | Contact Form |17 |
|19 | Analytics |18 |
|20 | Monitoring |19 |
|21 | Performance Optimisation |20 |
|22 | Accessibility |21 |
|23 | Security Audit |22 |
|24 | Production Deployment |23 |
|25 | Final UX Polish |24 |
|26 | Launch |25 |

---

## Detailed Milestones

### Milestone 0 – Discovery
**Goal:** Understand existing domain, resume, GitHub profile and content.
**Tasks:**
- Inspect existing website (if any).
- Inspect resume.
- Inspect GitHub.
- Catalog projects.
- Catalog professional experience.
- Catalog social links.
- Identify missing content.
- Identify outdated resume information.
- Create content inventory.
**Definition of Done:** No major content source is unknown; deliverables:
- `content-inventory.md`
- `professional-profile.md`
- `project-inventory.md`
- `social-links.json`

---

### Milestone 1 – Architecture
**Goal:** Establish repository and basic technical foundation.
**Tasks:**
- Initialize repository.
- Select framework (Next.js).
- Configure TypeScript, linting, formatting, environment validation.
- Create initial application architecture (folders, CI workflow).
- Create design‑token architecture scaffold.
**Definition of Done:** Clean application boots locally and CI passes.

---

### Milestone 2 – Design System
**Goal:** Build a reusable NeoPOP‑inspired design system.
**Tasks:**
- Install NeoPOP.
- Evaluate available components.
- Create compatibility layer.
- Define design tokens (typography, colors, spacing, elevation, motion, breakpoints).
- Create dark/light themes.
**Definition of Done:** Private design‑system showcase route (`/design-system`) is functional; all future pages can be built using reusable design primitives.

---

### Milestone 3 – Site Shell
**Goal:** Core navigation and layout infrastructure.
**Tasks:**
- Navigation bar.
- Footer.
- Page transitions.
- Theme switching.
- Mobile menu.
- Responsive container.
- Command palette.
- SEO foundation (metadata, sitemap, robots).
**Definition of Done:** All primary routes exist and navigate correctly.

---

### Milestone 4 – Hero Section
**Goal:** Premium first impression.
**Tasks:**
- Hero typography.
- Primary CTA (Explore My Work, Ask My AI).
- Secondary CTA (Download Resume, LinkedIn, GitHub).
- NeoPOP visual composition.
- Responsive behavior.
- Animation and reduced‑motion support.
**Definition of Done:** Hero creates intended premium impression without hurting performance.

---

### Milestone 5 – Professional Snapshot
**Goal:** Recruiter can understand profile in seconds.
**Tasks:**
- Metric cards (years experience, domains, automation, cloud/CI‑CD).
- Summary copy.
- Capability areas.
- Recruiter‑oriented positioning.
**Definition of Done:** A recruiter can grasp the profile without scrolling through the full resume.

---

### Milestone 6 – Career Timeline
**Goal:** Interactive, browsable career history.
**Tasks:**
- Interactive timeline component.
- Company cards with expandable details (role, dates, domain, responsibilities, technologies, notable projects).
- Mobile layout adaptation.
**Definition of Done:** Complete career history is browsable.

---

### Milestone 7 – Achievements
**Goal:** Showcase impact rather than responsibilities.
**Tasks:**
- Achievement cards with problem, responsibility, approach, technology, outcome, domain.
- Visual hierarchy and technology association.
**Definition of Done:** Page communicates accomplishments rather than simple duties.

---

### Milestone 8 – Projects
**Goal:** Present professional, personal, and engineering‑lab projects.
**Tasks:**
- Project index page.
- Project cards (name, value proposition, category, technologies, why built, what learned, architecture, GitHub, live demo).
- Filters and categories (Professional, Personal Engineering, Engineering Lab, Finance, AI).
**Definition of Done:** Visitors can discover and explore projects with appropriate context.

---

### Milestone 9 – GitHub Integration
**Goal:** Dynamically surface curated repository data.
**Tasks:**
- GitHub API integration (public repos, descriptions, languages, stars, forks, recent activity, pinned repos).
- Curation layer (`featured`, `priority`, `category`, `professional_relevance`).
- Caching and fallback on API failure.
**Definition of Done:** No GitHub call on every page request; displayed data is curated and resilient to API errors.

---

### Milestone 10 – Resume
**Goal:** Interactive resume + PDF download.
**Tasks:**
- Interactive resume component (summary, experience, skills, education, certifications, achievements).
- PDF viewer/link and download button.
- Ensure phone number is redacted.
**Definition of Done:** Resume accessible, printable, and phone‑free.

---

### Milestone 11 – Social Hub
**Goal:** Centralised social links section.
**Tasks:**
- Social cards for LinkedIn, GitHub, X, Medium, Stack Overflow, Telegram, Discord, Instagram, Quora, Facebook, LeetCode, Codewars, Resume.
- Accessibility and responsive layout.
**Definition of Done:** All provided social links are visible and functional.

---

### Milestone 12 – Testimonials
**Goal:** Display professional endorsements.
**Tasks:**
- Render testimonial cards (quote, name, role, company, profile URL).
- Hide section if no testimonials are available.
**Definition of Done:** Section appears only when real testimonials exist.

---

### Milestone 13 – AI Knowledge Base
**Goal:** Structured knowledge source for the assistant.
**Tasks:**
- Define document format (title, source_type, classification, content, version).
- Implement chunking, embeddings, pgvector storage.
- Metadata filtering for retrieval.
**Definition of Done:** Factual question retrieves correct professional information.

---

### Milestone 14 – Gemini Integration
**Goal:** Connect to Google Gemini LLM.
**Tasks:**
- Implement `LLMProvider` interface with Gemini.
- Streaming, timeout, retry, error handling, token limits, model configuration via `GEMINI_MODEL`.
**Definition of Done:** AI responds reliably to professional questions.

---

### Milestone 15 – AI Guardrails
**Goal:** Ensure safe, truthful AI behavior.
**Tasks:**
- Topic classification, PII detection, prompt‑injection protection, confidential data filtering, output validation, redirection logic, rate limiting.
**Definition of Done:** Adversarial test suite passes.

---

### Milestone 16 – AI Chat UX
**Goal:** Provide a polished chat interface.
**Tasks:**
- Chat launcher and page.
- Message bubbles, streaming responses, suggested prompts, typing indicator, error states, feedback collection, conversation reset.
- Desktop floating panel and mobile full‑screen mode.
**Definition of Done:** Chat works smoothly on both desktop and mobile.

---

### Milestone 17 – Job Description Analyzer
**Goal:** Map a job description to Ankit's profile.
**Tasks:**
- JD paste UI.
- Analysis engine producing overall positioning, strong matches, transferable experience, learning agility, interview talking points, recommended positioning.
**Definition of Done:** Tool produces positive, truthful, evidence‑based fit narratives.

---

### Milestone 18 – Contact Form
**Goal:** Enable visitors to reach out.
**Tasks:**
- Form fields (Name, Email, Company, Message).
- Validation, spam protection/rate limiting.
- Email delivery via transactional provider.
- Success/failure UI states.
**Definition of Done:** Form submissions are delivered securely without exposing private data.

---

### Milestone 19 – Analytics
**Goal:** Capture product‑relevant metrics.
**Tasks:**
- Integrate PostHog (free tier) for events listed in PRD.
- Privacy‑conscious configuration (no personal data).
**Definition of Done:** Events fire correctly and respect privacy settings.

---

### Milestone 20 – Monitoring
**Goal:** Observe runtime health.
**Tasks:**
- Set up Sentry for frontend & API error monitoring.
- Track AI failures, GitHub API failures, performance issues.
**Definition of Done:** Errors are captured and alertable.

---

### Milestone 21 – Performance Optimisation
**Goal:** Meet Lighthouse targets.
**Tasks:**
- Bundle analysis, image & font optimisation, caching, lazy loading of heavy assets, removal of unnecessary dependencies.
**Definition of Done:** LCP < 2.5 s, CLS < 0.1, INP < 200 ms on typical mobile.

---

### Milestone 22 – Accessibility
**Goal:** WCAG 2.2 AA compliance.
**Tasks:**
- axe testing, keyboard navigation, screen‑reader labelling, reduced‑motion support, contrast checks.
**Definition of Done:** No critical accessibility violations.

---

### Milestone 23 – Security Audit
**Goal:** Verify robust security posture.
**Tasks:**
- XSS, injection, API‑key exposure, rate‑limiting, authentication, CSRF, prompt‑injection, PII leakage, security headers, database security tests.
**Definition of Done:** All tests pass; no vulnerabilities found.

---

### Milestone 24 – Production Deployment
**Goal:** Deploy the site to production.
**Tasks:**
- Deploy repository to GitHub → Vercel.
- Configure Cloudflare DNS for `ankitnandwani.com`.
- Set up HTTPS, redirects, sitemap, robots.txt, environment variables, monitoring.
**Definition of Done:** Live site reachable at the domain, all critical services (AI, GitHub, Supabase) functional.

---

### Milestone 25 – Final UX Polish
**Goal:** Refine the experience through a recruiter walkthrough.
**Tasks:**
- Simulate visitor timelines (30 s, 2 min, 5 min) and assess comprehension.
- Fix confusing copy, excessive animations, unnecessary clicks, poor mobile UX, slow pages, weak CTAs, inconsistent spacing, visual clutter.
**Definition of Done:** Recruiter walkthrough scores high on usability and memorability.

---

### Milestone 26 – Launch
**Goal:** Public release.
**Tasks:**
- Final pre‑launch checklist (domain, HTTPS, resume, no phone, social links, GitHub, chatbot, job analyzer, AI privacy tests, mobile/desktop, dark/light mode, SEO, analytics, error monitoring, no secrets).
**Definition of Done:** All checklist items verified; site officially launched.

---

## Acceptance Criteria Summary
Each milestone’s **Definition of Done** (see above) serves as the acceptance criteria. Completion of a milestone unlocks the next dependent milestone.

---

*Roadmap generated from PRD. No new requirements introduced.*
