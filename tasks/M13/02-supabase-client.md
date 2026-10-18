# M13.02 — Set Up Supabase Client Wrapper and Environment Validation

## Objective

Create a type-safe Supabase client wrapper with environment variable validation to ensure secure and reliable database connections for the AI knowledge base.

## Context

The application requires a Supabase client to interact with the knowledge base tables. Following PRD §51 (Backend / data store: Supabase PostgreSQL with pgvector) and PRD §83 (Free‑tier focus), we need to establish a connection layer that validates required environment variables and provides a singleton client instance. This client will be used by document ingestion, embedding storage, and retrieval services.

## Requirements
- Validate that Supabase environment variables are present (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).
- Create a singleton Supabase client instance using the official @supabase/supabase-js library.
- Provide separate clients for anon and service role keys where appropriate (service role for writes, anon for reads if RLS is configured).
- Export type-safe helper functions for common knowledge base operations.
- Handle connection errors gracefully.
- Ensure the client works in both server and client contexts (though knowledge base operations will primarily be server-side).

## Scope
### In scope
- Environment variable validation at startup
- Supabase client initialization with proper options
- Singleton export for reuse across the application
- Basic error handling and logging
- TypeScript types for Supabase response data

### Out of scope
- Actual database queries for knowledge base (will be implemented in specific service layers)
- Row Level Security policy configuration (done via Supabase dashboard/sql)
- Connection pooling optimizations (beyond what the client library provides)

## Dependencies
- @supabase/supabase-js package (to be installed)
- Environment variables configured in .env.local
- Knowledge base schema defined (M13.01)

## Files / Areas Expected To Change
- `src/lib/supabase.ts` (to be created) - Main Supabase client wrapper
- `src/lib/env.ts` (may be updated to include Supabase variable validation)
- `package.json` (to add @supabase/supabase-js dependency)

## Implementation Guidance
1. Install @supabase/supabase-js: `npm install @supabase/supabase-js`
2. Update src/lib/env.ts to validate Supabase variables (or create a separate validation function).
3. Create src/lib/supabase.ts:
   - Import { createClient } from '@supabase/supabase-js'
   - Read SUPABASE_URL and SUPABASE_ANON_KEY from process.env
   - Optionally create a service role client using SUPABASE_SERVICE_ROLE_KEY for privileged operations
   - Export a singleton client (or two clients: anon and service)
   - Consider creating a wrapper that adds retry logic or error formatting
   - Export typed knowledge base functions if desired (e.g., async function getDocumentsByClassification(classification))
4. Ensure the client is only instantiated once (singleton pattern).
5. Add JSDoc comments for clarity.
6. Test that the client can connect to Supabase (simple query like selecting version()).

## Acceptance Criteria
- Supabase client successfully initializes without errors when environment variables are valid.
- Missing environment variables throw a clear error during initialization.
- Client singleton pattern works (multiple imports return the same instance).
- Client can execute a simple query (e.g., SELECT supabase_version()).
- TypeScript types are correctly inferred for knowledge base operations.

## Testing Requirements
- Verify environment validation catches missing variables.
- Test that client initialization succeeds with valid .env.local.
- Perform a simple query to confirm connectivity.
- Ensure no runtime errors when importing the client in different modules.

## Security / Privacy Considerations
- Service role key should never be exposed to the client browser; ensure it's only used in server-side code.
- Anon key can be used for read operations if RLS is configured to restrict to PUBLIC/PROFESSIONAL content.
- Error messages should not expose sensitive connection details.
- Consider using .env.local for development and ensuring production variables are set correctly in Vercel.

## Performance / Accessibility Considerations
- Client initialization should be lightweight and cached.
- Consider setting appropriate timeouts for database operations.
- The client library handles connection pooling internally.

## Definition of Done
- @supabase/supabase-js is installed and saved in package.json.
- Environment variables are validated on client initialization.
- Supabase client singleton is exported from src/lib/supabase.ts.
- Client can successfully connect to Supabase and execute a basic query.
- Error handling provides meaningful messages for configuration issues.

## Related Requirements
- PRD §51: Backend / data store – Supabase PostgreSQL with pgvector
- PRD §83: Free‑tier focus
- PRD §104: CI/CD (unit, integration, e2e tests)