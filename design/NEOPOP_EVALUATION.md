# NeoPOP Component Evaluation

This document evaluates the NeoPOP components available in the `@cred/neopop-web` package to determine how they will be used in the Ankit Nandwani portfolio and AI recruiter assistant.

## Evaluation Criteria

- **Use as‑is**: The component can be used directly with minimal or no changes, likely by applying our design tokens via Tailwind utility classes or through a compatibility layer that provides the necessary theme/context.
- **Adapt**: The component requires some adaptation, such as wrapping it to adjust default props, mapping our design tokens to its API, or modifying its internal styling via a compatibility layer.
- **Replace**: The component is not suitable for our needs, and we will implement a custom component from scratch.

## Component Evaluation

| Component | Category | Decision | Notes |
|-----------|----------|----------|-------|
| Button | Primitive | Adapt | NeoPOP Button provides variants (elevated, flat, link). We will adapt it to use our design tokens for colors, spacing, and radius, likely via a compatibility layer that sets the theme or by wrapping it to accept Tailwind classes. |
| ElevatedCard | Container | Adapt | Provides an elevated surface with shadow. We will adapt it to use our elevation tokens and Tailwind for styling. |
| Typography | Text | Use as‑is | The Typography component likely allows setting variant (e.g., h1, body) and can be styled with Tailwind. We may use it as‑is or adapt to map our typography tokens. |
| Tag | Label | Adapt | Used for categorization. We will adapt colors and radius to match our design tokens. |
| Back | Navigation | Adapt | A back button for navigation. We will adapt its styling and possibly replace with custom navigation for desktop, but keep for mobile if needed. |
| Header | Layout | Adapt | A header component. We will adapt it to fit our site's header design, possibly using it as a base for mobile header. |
| Toggle | Control | Adapt | A toggle switch. We will adapt it to use our colors for checked/unchecked states. |
| Radio | Control | Adapt | Radio button group. We will adapt styling. |
| Checkbox | Control | Adapt | Checkbox. We will adapt styling. |
| InputField | Form | Adapt | Text input. We will adapt to use our tokens for border, radius, focus states, and integrate with Tailwind forms. |
| SearchBar | Form | Adapt | Combines input and button. We will adapt styling. |
| BottomSheet | Modal | Adapt | Bottom sheet modal. We will adapt for mobile menus or action sheets; may replace with custom modal for desktop. |
| BottomSheetCustom | Modal | Adapt | Customizable bottom sheet. Same as above. |
| Dropdown | Menu | Adapt | Dropdown menu. We will adapt for use in filters, navigation, etc. |
| ScoreMeter | Data Visualization | Replace | A circular progress meter. We may replace with a custom implementation or use a library if needed, but we can adapt if it fits our needs (e.g., for skill proficiency). |
| Slider | Input | Adapt | Range slider. We will adapt to use our tokens for track and thumb. |
| ToastContainer | Feedback | Adapt | Container for toast messages. We will adapt positioning and styling. |
| showToast | Function | Adapt | Function to trigger toast. We will adapt to use our toast design. |
| Chevron | Icon | Use as‑is | Simple chevron icon. We may use as‑is or replace with Tailwind icons if preferred. |
| Column | Layout | Use as‑is | Flex column layout. We can use as‑is with Tailwind or adapt. |
| Cross | Icon | Use as‑is | Simple cross icon. Similar to Chevron. |
| HorizontalDivider | Layout | Use as‑is | Horizontal rule. We can use as‑is or replace with Tailwind hr. |
| HorizontalSpacer | Layout | Use as‑is | Spacer for horizontal space. We can use as‑is or use Tailwind spacing. |
| PageContainer | Layout | Adapt | Container for page content. We will adapt to use our max-width and padding tokens. |
| Pointer | Icon | Use as‑is | Pointer icon (maybe for tooltip). We can use as‑is. |
| Row | Layout | Use as‑is | Flex row layout. Similar to Column. |
| VerticalSpacer | Layout | Use as‑is | Vertical spacer. Similar to HorizontalSpacer. |

## Notes

- The evaluation is based on the component names and a brief inspection of the exported API. Further details may be found in the NeoPOP documentation or source code.
- The compatibility layer (to be created in M02.03) will be responsible for mapping our design tokens to NeoPOP components where necessary.
- Components marked "Replace" are those that either do not fit our UI patterns or for which we anticipate needing custom behavior that would be more complex to adapt.
- This evaluation will guide the creation of the compatibility layer and the selection of components for implementation in subsequent milestones.

