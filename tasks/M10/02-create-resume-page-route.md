# M10.02 — Create resume page route and layout

## Objective

Set up the route and basic layout for the resume page at `/resume`. This includes creating the Next.js page file and applying the standard layout structure used throughout the site.

## Context

The resume page will be accessible via the navigation item labeled "RESUME" and will serve as the main entry point for the interactive resume experience. The page should follow the same layout pattern as other pages (e.g., home, projects) using the `ResponsiveContainer` component and maintaining consistent styling.

## Requirements

- Create `app/resume/page.tsx` that renders the resume page.
- Use the `ResponsiveContainer` component from `@/src/components/layout` to maintain consistent width and centering.
- Apply the same background and font styling as other pages (from `app/layout.tsx` and `globals.css`).
- Export metadata for the resume page (title, description) using the existing metadata generation pattern.
- The page should initially contain a placeholder indicating that the resume content will be loaded (to be implemented in subsequent tasks).

## Scope

### In scope
- Creating the Next.js route for `/resume`.
- Setting up the page structure with `ResponsiveContainer`.
- Adding basic metadata.

### Out of scope
- Creating the interactive resume components (to be implemented in subsequent tasks).
- Fetching or displaying resume data.
- Adding animations or advanced styling.

## Dependencies

- None (foundational task for the resume milestone).

## Files / Areas Expected To Change
- `app/resume/page.tsx` – new file to be created.

## Implementation Guidance
1. Create the directory `app/resume/` if it doesn't exist.
2. Create `app/resume/page.tsx` with the following structure:
   ```typescript
   import { ResponsiveContainer } from '@/src/components/layout';
   import { generateBaseMetadata } from '@/src/seo/metadata';

   export const metadata = {
     ...generateBaseMetadata('Resume', 'Ankit Nandwani — Interactive Resume'),
     // Optionally override description or add specific metadata
   };

   export default function ResumePage() {
     return (
       <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
         <ResponsiveContainer>
           <main className="flex flex-1 w-full flex-col items-center justify-between">
             {/* Placeholder for resume content */}
             <div className="py-12 text-center">
               <h2 className="text-2xl font-bold">Resume Content Loading...</h2>
               <p className="mt-4 text-muted-foreground">Interactive resume section will appear here.</p>
             </div>
           </main>
         </ResponsiveContainer>
       </div>
     );
   }
   ```
3. Ensure the page uses the same background color (`bg-zinc-50`) and text styling as the home page.
4. Verify that the navigation link to `/resume` works correctly.

## Acceptance Criteria
- [ ] The route `/resume` is accessible and renders without errors.
- [ ] The page uses the `ResponsiveContainer` for consistent layout.
- [ ] The page metadata is set correctly (title includes "Resume").
- [ ] The page follows the same visual styling as other site pages (background, fonts).
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.

## Testing Requirements
- [ ] Manual verification: navigate to `/resume` via navigation bar and confirm page loads.
- [ ] Run `npm run dev` and verify the page loads in development mode.
- [ ] Run `npm run build` to ensure the page builds correctly for production.
- [ ] Run `npm run lint` to check for linting errors.
- [ ] Run `npm run typecheck` to ensure TypeScript correctness.

## Security / Privacy Considerations
- No direct security or privacy implications at this stage; the page is a placeholder.

## Performance / Accessibility Considerations
- The page should follow the same accessibility patterns as other pages (semantic HTML, proper heading structure).
- No performance concerns for a placeholder page.

## Definition of Done
- The route `/resume` is successfully created and accessible.
- The page loads with the correct layout and styling.
- The task is ready for the next task (M10.03) to depend on it.

## Related Requirements
- PRD §22: Resume Experience — Interactive resume with summary, experience, skills, education, certifications, achievements.
- ROADMAP Milestone 10: Resume — Interactive resume component + PDF download.
- Navigation items defined in `src/data/navigationItems.ts` include a RESUME link to `/resume`.