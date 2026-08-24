# Ankit Nandwani Professional Portfolio & AI Recruiter Assistant

## Overview

This repository contains the source code and supporting documentation for a premium, interactive personal portfolio website that showcases **Ankit Nandwani** – a Senior SDET / Automation Engineer. The site serves two primary purposes:

1. **Recruiter‑focused portfolio** – quickly conveys who Ankit is, his seniority, technical strengths, and key achievements.
2. **AI‑powered assistant** – “Ask Ankit” lets visitors ask professional‑level questions about Ankit’s experience, projects, and fit for specific roles.

The project is deliberately engineered as a **single‑page, server‑rendered Next.js application** with a minimal, free‑tier‑friendly stack (see PRD).

## Repository Structure

```
/                # Project root
├─ app/          # Next.js pages / route handlers
├─ components/   # Re‑usable UI components (NeoPOP‑based)
├─ lib/          # Utilities (GitHub API wrapper, AI client, Supabase init, etc.)
├─ content/      # Version‑controlled JSON/Markdown content files
│   ├─ profile/
│   ├─ experience/
│   ├─ projects/
│   └─ …
├─ db/           # Supabase schema, migrations, seed data
├─ design/       # Custom design‑system tokens, themes, motion configs
├─ docs/         # Additional project documentation (architecture, rationale)
├─ tests/        # Unit, integration, and e2e tests (Playwright)
├─ public/       # Static assets (images, favicons)
└─ ...
```

## Key Documentation Files

| File                    | Purpose                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `ROADMAP.md`            | Logical milestones, tasks, dependencies, and acceptance criteria derived from **PRD.md**. |
| `PROJECT_STATE.md`      | Current project status, known blockers, and important technical facts.                    |
| `DECISIONS.md`          | All architectural and product decisions already made (and pending decisions).             |
| `CHANGELOG.md`          | Chronological record of notable changes.                                                  |
| `TODO.md`               | Immediate actionable tasks to bootstrap the repo.                                         |
| `README.md` (this file) | High‑level project summary and contributor guidance.                                      |
| `docs/`                 | Supporting docs such as architecture overview, design rationale, etc.                     |

## Getting Started (for future contributors / AI agents)

1. **Clone the repository** and install dependencies:
   ```bash
   git clone <repo‑url>
   cd <repo>
   npm install   # or yarn install
   ```
2. **Set up environment variables**
   - Copy `.env.example` to `.env.local` and fill in the placeholders (API keys, Supabase URL, etc.).
3. **Run the development server**
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:3000`.
4. **Run the CI checks locally**
   ```bash
   npm run lint
   npm run typecheck
   npm run test   # runs unit, integration, and e2e suites
   ```
5. **Follow the roadmap**
   - Consult `ROADMAP.md` to see the ordered milestones.
   - Update `PROJECT_STATE.md` after each milestone is completed (the `AGENTS.md` workflow expects this).
6. **Respect the Rules (see `AGENTS.md`)**
   - Do **not** invent professional information.
   - Never expose private data (e.g., phone number).
   - Follow the coding standards (TypeScript strict mode, ESLint, Prettier, Conventional Commits).
   - Run tests and lint before committing any code.

## Contributing / AI Agent Workflow

- **Before starting any work**: read `AGENTS.md`, `PROJECT_STATE.md`, and `ROADMAP.md`.
- **When a milestone is finished**:
  1. Update `PROJECT_STATE.md` (current milestone, completed tasks).
  2. Add an entry to `CHANGELOG.md`.
  3. Run the full test suite and ensure the CI passes.
  4. Commit with a conventional message (e.g., `feat(milestone-4): implement hero section`).
- **If you encounter missing information** (e.g., exact years of experience), add a `TODO` entry and request clarification – do **not** guess.

## License

The code in this repository is released under the MIT License. The NeoPOP design system is Apache‑2.0 licensed, and its usage complies with that license.

---

_This README was generated as part of the initial project documentation setup. No implementation code has been added yet._
