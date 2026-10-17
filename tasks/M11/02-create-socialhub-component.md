# M11.02 — Create SocialHub component

## Objective

Create a reusable SocialHub component that displays social links in an elegant card-based layout, using the existing design system (Card component, icons, etc.). The component should be responsive, accessible, and visually appealing, suitable for placement on the homepage.

## Context

The SocialHub component will consume the social links configuration from `src/data/socialLinks.ts` and render each link as a card featuring the platform icon, label, and optionally a subtle hover effect. The component should follow the same design patterns as other components in the codebase (e.g., using the Card component from `@/src/components/ui/Card.tsx`).

## Requirements

- Create a new component at `src/components/socialHub/SocialHub.tsx`.
- Import the `socialLinks` array from `@/src/data/socialLinks`.
- Map over the social links to render a card for each platform.
- Each card should use the `Card` component with appropriate elevation and radius.
- Inside each card, display the platform icon (using react-icons) and the platform label.
- Implement a consistent layout: icon above label, centered, with appropriate spacing.
- Add hover effects (e.g., slight elevation change, color shift) using Framer Motion or CSS transitions.
- Ensure the component is responsive: on large screens, display cards in a grid; on small screens, stack vertically or use a horizontal scrollable list if needed.
- Follow accessibility best practices: icons should have `aria-hidden="true"`, labels should be readable by screen readers, and each card should be a link with appropriate `aria-label`.
- Use the existing icon mapping pattern (extend the `iconMap` in the component or create a separate mapping utility).
- Export the component as the default export.
- Ensure the component uses client-side rendering (`'use client';`) if it uses interactive effects or state.
- Do not fetch live data (e.g., follower counts); only static links and icons.

## Scope

### In scope
- Creating the SocialHub component with card-based design.
- Implementing responsive layout (grid on desktop, stack on mobile).
- Adding hover and focus animations.
- Ensuring accessibility (proper labels, keyboard navigation).
- Using existing design system components (Card, icons).

### Out of scope
- Fetching live social media metrics (e.g., follower counts).
- Creating a separate page for social links (unless required later).
- Integrating the component into the homepage (handled in M11.03).
- Updating the social links configuration (handled in M11.01).

## Dependencies
- M11.01: Update social links configuration (must be completed first to ensure data exists).
- Existing Card component (`@/src/components/ui/Card.tsx`).
- Existing icon packages (react-icons/fi, react-icons/si, etc.) – may need to install additional icon packs for new platforms.

## Files / Areas Expected To Change
- `src/components/socialHub/SocialHub.tsx` – new file to be created.
- May need to update `tsconfig.json` paths if new aliases are added (unlikely).
- May need to install additional react-icon packages if icons for new platforms are not already available.

## Implementation Guidance
1. Create the directory `src/components/socialHub/` if it doesn't exist.
2. Create `src/components/socialHub/SocialHub.tsx` with the following structure:
   ```typescript
   'use client';

   import React from 'react';
   import { Card } from '@/src/components/ui/Card';
   import { motion } from 'framer-motion';
   import { socialLinks } from '@/src/data/socialLinks';
   // Import icons as needed; create a mapping object

   const iconMap = {
     // existing mappings
     linkedin: ...,
     github: ...,
     // add mappings for new platforms
   };

   export const SocialHub = () => {
     return (
       <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         {socialLinks.map((link) => {
           const Icon = iconMap[link.platform] || /* fallback */;
           return (
             <motion.div
               key={link.platform}
               whileHover={{ scale: 1.03 }}
               whileTap={{ scale: 0.98 }}
               className="cursor-pointer"
             >
               <Card
                 elevation="sm"
                 radius="md"
                 className="flex flex-col items-center justify-center p-4 bg-background"
               >
                 <div className="mb-3">
                   <Icon className="h-6 w-6" aria-hidden="true" />
                 </div>
                 <div className="text-center text-sm font-medium">
                   {link.label}
                 </div>
               </Card>
             </motion.div>
           );
         })}
       </section>
     );
   };

   export default SocialHub;
   ```
3. Adjust the grid layout based on design preferences (maybe use `flex-wrap` or other layout).
4. Install any missing react-icon packages if needed (e.g., `react-icons/fi` for more icons, `react-icons/si` for Stack Overflow, etc.).
5. Ensure the component is exported and can be imported elsewhere.

## Acceptance Criteria
- [ ] The component `src/components/socialHub/SocialHub.tsx` is created and exports a default React component.
- [ ] The component renders a card for each social link in the configuration.
- [ ] Each card displays the platform icon and label.
- [ ] The component uses the Card component for consistent design.
- [ ] The component includes hover/focus animations using Framer Motion or CSS.
- [ ] The component is responsive (tested at various breakpoints).
- [ ] The component follows accessibility guidelines (aria-label on links, aria-hidden on icons).
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.
- [ ] The component can be imported and used without errors.

## Testing Requirements
- [ ] Manual verification: render the component in isolation (e.g., in a test page) and verify it displays cards for all platforms.
- [ ] Check that icons are displayed correctly (no missing icon errors).
- [ ] Verify responsive behavior: resize viewport to see layout changes.
- [ ] Run `npm run typecheck` to check TypeScript correctness.
- [ ] Run `npm run lint` to check for linting errors.
- [ ] Ensure no new dependencies cause issues (if icon packs were added).

## Security / Privacy Considerations
- No direct security or privacy implications; only renders static links and icons.

## Performance / Accessibility Considerations
- The component should not cause layout shifts.
- Icons should be accessible (hidden from screen readers if labels are present).
- Links should be keyboard navigable and have clear focus indicators.

## Definition of Done
- The SocialHub component is fully functional, responsive, and accessible.
- The task is ready for the next task (M11.03) to depend on it.

## Related Requirements
- PRD §21: Social Hub — Create one elegant social section rather than placing 15 icons in the footer.
- ROADMAP Milestone 11: Social Hub — Social cards for LinkedIn, GitHub, X, Medium, Stack Overflow, Telegram, Discord, Instagram, Quora, Facebook, LeetCode, Codewars, Resume.
- Design System: Use of Card component and motion animations.