# M19.03 – Enable Client-Side CTA Click Tracking via Proxy Endpoint

## Objective

Update the client-side analytics wrapper (`src/lib/analytics/client.ts`) to send CTA click events to the new server-side proxy endpoint (`/api/analytics`), enabling real CTA click tracking from the browser.

## Context

Currently, `trackCtaClicked` in `src/lib/analytics/client.ts` only logs to console:
```typescript
// On client-side, we can't send to PostHog directly without exposing keys
// This would need a server-side endpoint to proxy the event
// For now, we just log to console
```

With M19.02's `/api/analytics` proxy endpoint in place, the client can now send CTA click events to the server, which forwards them to PostHog.

## Requirements

- Update `trackCtaClicked` in `src/lib/analytics/client.ts` to POST to `/api/analytics`
- Include required payload: `sessionId`, `queryId`, `ctaType`, `targetDomain`
- Handle response: success → log, error → log warning (don't block UI)
- Fire-and-forget: don't await response in a way that blocks user interaction
- Graceful degradation: if endpoint unavailable, log to console and continue
- Use existing `getSessionId` and `generateClientKey` for session management
- Respect `getAnalyticsConfig()` for enabling/disabling

## Scope

### In scope

- `src/lib/analytics/client.ts` updates
- `trackCtaClicked` function modification
- Client-side session management (already exists)

### Out of scope

- Proxy endpoint creation (M19.02)
- Other event types (feedback, page views - future work)
- Server-side changes

## Dependencies

- M19.02 (analytics proxy endpoint)

## Files / Areas Expected To Change

- `src/lib/analytics/client.ts`

## Implementation Guidance

1. **Modify `trackCtaClicked`**:
   ```typescript
   export async function trackCtaClicked(
     sessionId: string,
     queryId: string,
     ctaType: CtaType,
     targetDomain: string,
     config: AnalyticsConfig = getAnalyticsConfig()
   ): Promise<void> {
     // Always log in development
     if (config.logToConsole) {
       console.log('[analytics] cta_clicked', { sessionId, queryId, ctaType, targetDomain });
     }

     if (!config.enabled) {
       return;
     }

     try {
       const response = await fetch('/api/analytics', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           eventType: 'cta_clicked',
           sessionId,
           queryId,
           ctaType,
           targetDomain,
           timestamp: new Date().toISOString(),
         }),
         // Don't block UI on analytics
         keepalive: true,
       });

       if (!response.ok) {
         console.warn('[analytics] CTA tracking failed:', response.status);
       }
     } catch (error) {
       // Silent failure - analytics shouldn't break UX
       console.warn('[analytics] CTA tracking error:', error);
     }
   }
   ```

2. **Use `keepalive: true`** to ensure request completes even if page unloads.

3. **Session management**: Client already has `getSessionId` and `generateClientKey`. The sessionId should be generated/stored client-side (e.g., in `sessionStorage` or via the existing in-memory store).

4. **Query ID**: Pass from the component that knows the current query context (ChatPanel, JobFitResults, ContactForm).

5. **Error handling**: Never throw - analytics failures must not affect user experience.

## Acceptance Criteria

- `trackCtaClicked` sends POST to `/api/analytics` with correct payload
- Events received by proxy endpoint and forwarded to PostHog
- Errors don't block UI (silent failure with console warning)
- Works with `keepalive: true` for page unload scenarios
- Respects `config.enabled` (disabled in development without credentials)
- Lint, typecheck, build pass

## Testing Requirements

- Unit test: `trackCtaClicked` calls fetch with correct payload
- Unit test: Handles 200, 400, 500 responses gracefully
- Unit test: Network error doesn't throw
- Integration test: Client click → API → PostHog (with test credentials)
- Manual test: Click CTA in ChatPanel/JobFitResults → verify in PostHog

## Security / Privacy Considerations

- No PostHog key exposed to client
- Only CTA click data sent (no PII)
- `targetDomain` is domain-only (already enforced by event type)
- `sessionId` is anonymous UUID
- `keepalive` requests respect browser limits (64KB payload)

## Performance / Accessibility Considerations

- `keepalive: true` ensures tracking completes on navigation
- Fire-and-forget doesn't block main thread
- Minimal payload size
- No impact on page load or interaction latency

## Definition of Done

- `trackCtaClicked` sends events to `/api/analytics`
- Events flow: Client → Proxy → PostHog
- Error handling doesn't affect UX
- Lint, typecheck, build pass

## Related Requirements

- PRD §46: CTA click tracking
- PRD §90: CTA links in job fit analysis
- ROADMAP M19: Analytics