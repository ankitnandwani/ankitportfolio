# M05.04 — Add capability areas section

## Objective

Create a section for capability areas that visually communicates Ankit's key technical and professional capabilities in a recruiter-friendly format. This section should present capability labels or icons in a way that is easy to scan and understand, without inventing any capabilities.

## Context

Following the metric cards and summary copy, the professional snapshot section includes capability areas to highlight specific strengths. According to PRD §11, this includes "Capability areas." These should be presented as visually distinct items (like badges, chips, or labels) that communicate key areas of expertise such as specific technologies, methodologies, or domains. The goal is to allow recruiters to quickly see where Ankit's strengths lie.

## Requirements
- Create a CapabilityAreas React component that displays a list of capability labels
- Capabilities should be grouped or categorized if appropriate (e.g., Quality Engineering, Backend/API, CI/CD, Cloud/Data, AI/Modern Engineering)
- Use the Badge component from src/components/ui/Badge.tsx or create similar visual elements
- Capability data should come from a verified source (resume or professional profile) - no inventing capabilities
- Design should be visually scannable with appropriate spacing and hierarchy
- Responsive layout that works on mobile and desktop
- Follow the design system styling for badges/chips
- Do not invent professional capabilities; component should display whatever capabilities are provided in data
- Make the capability list configurable or editable via data

## Scope

### In scope
- CapabilityAreas React component (src/components/capabilityAreas/index.tsx)
- Data structure for capability areas (could be part of professional snapshot data or separate)
- Usage of design system Badge component or custom badge implementation
- Layout of capabilities in a responsive grid or wrap layout
- Typography styling using design system tokens for badge labels
- Export from index.ts for easy import
- Clear separation between data (capabilities list) and presentation

### Out of scope
- Creating the actual capability areas list (this should come from verified resume/content)
- Metric cards component (M05.02)
- Summary copy section (M05.03)
- Integration into homepage layout (M05.05)
- Data validation against resume
- Inventing or creating fictional capabilities
- Detailed descriptions for each capability (just labels/names)

## Dependencies
- M05.01: Define professional snapshot data model (for potential integration)
- M05.02: Create ProfessionalSnapshot component (recommended order)
- M05.03: Add summary copy section (recommended order)
- Design system Badge component or equivalent
- Theme context for accessing design tokens

## Files / Areas Expected To Change
- src/components/capabilityAreas/index.tsx (new file)
- src/components/capabilityAreas/index.ts (new file)
- Potential updates to professional snapshot data model if capabilities are included there
- Potential updates to src/components/index.ts if barrel exports are used

## Implementation Guidance
1. Create src/components/capabilityAreas directory
2. Create index.tsx with the CapabilityAreas component
3. Create index.ts export file
4. Determine where capability areas data will come from:
   * Option 1: Extend professional snapshot data model to include capabilities array
   * Option 2: Create separate data file for capability areas
   * Option 3: Accept capabilities as a prop to the component (most flexible)
5. For this task, create the component to accept capabilities array as a prop
6. Use the Badge component to display each capability:
   * Import Badge from '@/src/components/ui/Badge'
   * Map over capabilities array to render individual badges
7. Implement responsive layout:
   * On desktop: display badges in rows with wrapping
   * On mobile: full-width badges with appropriate spacing
   * Consider using flex-wrap or CSS grid
8. Apply appropriate spacing between badges (use design system spacing tokens)
9. Use appropriate badge variants:
   * Consider different colors for different capability categories if data supports it
   * Otherwise, use a consistent badge style
10. Ensure accessibility:
    * Badges should have sufficient color contrast
    * Touch/click target size adequate if interactive (though likely just visual)
    * Screen reader friendly (aria-label if needed)
11. Follow the visual language: premium, bold, minimal, technical
12. Do not invent professional capabilities; use placeholder data that makes it clear it needs to be replaced

## Acceptance Criteria
- [ ] src/components/capabilityAreas/index.tsx file created
- [ ] CapabilityAreas component accepts capabilities array as a prop
- [ ] Component renders each capability as a badge or similar visual element
- [ ] Uses design system Badge component for appearance
- [ ] Responsive layout works on mobile and desktop
- [ ] No invented professional information is displayed (will show placeholder data)
- [ ] TypeScript compiles without errors
- [ ] Lint passes
- [ ] Component can be imported and used in other files

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced

## Security / Privacy Considerations
- No security concerns as component only displays provided data
- Ensure no PII is inadvertently included in capability data
- Component should not perform any data validation or transformation that could invent information

## Performance / Accessibility Considerations
- [ ] Component should be lightweight and efficient rendering
- [ ] Accessibility:
   * Badge color contrast ratio >= 4.5:1 for text
   * Font size readable (minimum 16px equivalent)
   * Adequate spacing between interactive elements if applicable
   * Avoid relying solely on color to convey meaning
   * Support for user-scaled text

## Definition of Done
- CapabilityAreas component created and exported
- Component accepts capabilities array as prop and displays them as badges
- Responsive layout implemented
- TypeScript and lint checks pass
- No invented professional information in component
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §11: Professional Snapshot - capability areas
- PRD §14: Engineering Arsenal - grouped technical domains (Quality Engineering, Backend/API, CI/CD, Cloud/Data, AI/Modern Engineering)
- PRD §60: Design System - use of NeoPOP-inspired components
- PRD §71: Accessibility target WCAG 2.2 AA
- PRD §3.4: Expressive but honest - content must remain factual