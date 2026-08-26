# M03.06 — SEO foundation (metadata, sitemap, robots)

## Objective
Implement foundational SEO elements including dynamic metadata generation, sitemap.xml, and robots.txt to ensure the portfolio is discoverable by search engines and presents correctly in search results.

## Context
SEO is crucial for a professional portfolio to be discovered by recruiters and potential collaborators searching online. This task involves implementing technical SEO fundamentals that will help search engines crawl, index, and understand the site's content properly.

## Requirements
- Implement dynamic metadata generation (title, description) for different routes
- Create sitemap.xml that lists all accessible pages in the portfolio
- Implement robots.txt to guide search engine crawlers
- Ensure metadata includes Open Graph tags for social sharing
- Add Twitter Card tags for optimal presentation on Twitter/X
- Implement JSON-LD structured data for enhanced search results
- Ensure proper canonical URLs to prevent duplicate content issues
- Make metadata configurable per route/page
- Follow SEO best practices for professional portfolios

## Scope

### In scope
- Dynamic metadata generation using Next.js metadata API
- Sitemap.xml generation (static or dynamic)
- Robots.txt implementation
- Open Graph and Twitter Card meta tags
- JSON-LD structured data for organization/person
- Canonical URL implementation
- Metadata configuration per route

### Out of scope
- Advanced SEO analytics or tracking
- Keyword research or content optimization
- Backlink building or outreach
- Local SEO optimizations
- Schema.org types beyond Organization/Person
- Server-side rendering for SEO (Next.js already handles this)
- SEO auditing or monitoring tools

## Dependencies
- M02.01 – Install NeoPOP and configure Tailwind with design tokens
- M02.02 – Evaluate NeoPOP components and document selection
- M02.03 – Create compatibility layer
- M02.04 – Define elevations (shadow levels) and integrate with Tailwind
- M02.05 – Define motion (animation presets) using Framer Motion
- M02.06 – Define breakpoints and integrate with Tailwind
- M02.07 – Refine and finalize design tokens
- M02.08 – Implement dark/light themes with token overrides
- M02.09 – Create design system showcase route

## Files / Areas Expected To Change
- `app/layout.tsx` (to define base metadata)
- `app/page.tsx` (to define route-specific metadata)
- `app/[route]/page.tsx` files (as they are created for metadata)
- `app/sitemap.xml.js` (new file for dynamic sitemap generation)
- `app/robots.txt.js` (new file for robots.txt generation)
- `src/seo/metadata.ts` (new helper functions for metadata generation)
- `src/seo/structuredData.ts` (new helper for JSON-LD generation)
- `src/siteConfig.ts` (new configuration for site-wide SEO settings)

## Implementation Guidance
1. Use Next.js 13+ metadata API in route files to define dynamic titles and descriptions
2. Create a site configuration file with title, description, URLs, etc.
3. Implement helper functions to generate consistent metadata across routes
4. Generate Open Graph tags (og:title, og:description, og:image, og:url)
5. Generate Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image)
6. Implement JSON-LD structured data for Organization or Person schema
7. Create sitemap.xml.js that dynamically lists all routes
8. Implement robots.txt.js with appropriate crawl rules
9. Set canonical URLs to prevent duplicate content
10. Ensure metadata is accessible to crawlers (no client-side only generation)

## Acceptance Criteria
- [ ] Each page has unique, descriptive title tag
- [ ] Each page has meta description that summarizes content
- [ ] Open Graph tags are present for social sharing
- [ ] Twitter Card tags are present for optimal Twitter display
- [ ] JSON-LD structured data is implemented for Organization/Person
- [ ] Sitemap.xml is accessible and lists all portfolio pages
- [ ] Robots.txt is accessible and allows crawling of content
- [ ] Canonical URLs are set correctly
- [ ] Metadata is properly formatted and within recommended lengths
- [ ] No duplicate meta tags or conflicting information

## Testing Requirements
- Verify metadata appears correctly in page source (not just client-side rendered)
- Use SEO tools (like Screaming Frog or Sitebulb) to check for issues
- Validate JSON-LD using Google's Rich Results Test
- Check sitemap.xml format and validity
- Verify robots.txt syntax and rules
- Test social sharing preview using Twitter Card validator and Facebook Sharing Debugger
- Ensure metadata updates correctly when navigating between routes
- Test in both development and production builds

## Security / Privacy Considerations
- No security concerns for metadata implementation
- Avoid exposing sensitive information in metadata (PII, internal URLs, etc.)
- Ensure structured data doesn't reveal private information
- Robots.txt should not expose private directories

## Performance / Accessibility Considerations
- Metadata implementation should not impact LCP or other performance metrics
- Keep metadata size reasonable (avoid excessively long titles/descriptions)
- Ensure metadata doesn't delay page rendering
- Structured data should be lightweight and not block rendering
- Follow accessibility guidelines for any visible SEO elements (though most are invisible)

## Definition of Done
- SEO foundation elements are implemented and functional
- Dynamic metadata works for all routes
- Sitemap.xml and robots.txt are accessible and correct
- Open Graph and Twitter Card tags are present
- JSON-LD structured data is implemented
- All acceptance criteria are met
- Code is committed and passes linting/typechecking

## Related Requirements
- PRD.md: Information Architecture section (SEO foundation)
- PRD.md: Homepage section (discoverability)
- ROADMAP.md: Milestone 3 – Site Shell