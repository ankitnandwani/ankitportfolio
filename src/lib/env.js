/* eslint-disable @typescript-eslint/no-require-imports */
const { z } = require('zod');
const dotenv = require('dotenv');

// Load environment variables from .env.local if present
dotenv.config({ path: '.env.local' });

// Define the schema for required environment variables
const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().nonempty(),
  GEMINI_API_KEY: z.string().nonempty(),
  GEMINI_MODEL: z.string().nonempty(),
  GEMINI_EMBEDDING_MODEL: z.string().nonempty(),
  SUPABASE_URL: z.string().nonempty(),
  SUPABASE_ANON_KEY: z.string().nonempty(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().nonempty(),
  GITHUB_TOKEN: z.string().nonempty(),
  // The analytics credentials are optional. Without them the analytics layer
  // stays in its console only mode, which is how the site runs until a
  // PostHog project is set up. The same is true of the variables that are
  // only used by a milestone that has not been reached yet.
  POSTHOG_KEY: z.string().nonempty().optional(),
  POSTHOG_HOST: z.string().nonempty().optional(),
  SENTRY_DSN: z.string().nonempty(),
  UPSTASH_REDIS_REST_URL: z.string().nonempty(),
  UPSTASH_REDIS_REST_TOKEN: z.string().nonempty(),
  // The limits of the chat. They are optional, because the code has the
  // values PRD §48 suggests and a missing variable only means the default
  // is used.
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_DAILY_MAX: z.coerce.number().int().positive().optional(),
  // The limits of the job fit analyzer. They are optional, because the
  // code has the defaults and a missing variable only means the default
  // is used.
  JOB_FIT_WINDOW_SECONDS: z.coerce.number().int().positive().optional(),
  JOB_FIT_MAX_REQUESTS: z.coerce.number().int().positive().optional(),
  JOB_FIT_DAILY_WINDOW_SECONDS: z.coerce.number().int().positive().optional(),
  JOB_FIT_DAILY_MAX_REQUESTS: z.coerce.number().int().positive().optional(),
  JOB_FIT_MAX_TOKENS: z.coerce.number().int().positive().optional(),
  // The limits of the contact form. They are optional, because the
  // code has the defaults and a missing variable only means the default
  // is used.
  CONTACT_FORM_WINDOW_SECONDS: z.coerce.number().int().positive().optional(),
  CONTACT_FORM_MAX_REQUESTS: z.coerce.number().int().positive().optional(),
  CONTACT_FORM_DAILY_WINDOW_SECONDS: z.coerce.number().int().positive().optional(),
  CONTACT_FORM_DAILY_MAX_REQUESTS: z.coerce.number().int().positive().optional(),
  // Email delivery configuration
  EMAIL_PROVIDER: z.enum(['resend', 'console']).optional(),
  EMAIL_API_KEY: z.string().nonempty().optional(),
  EMAIL_TO: z.string().email().optional(),
  EMAIL_FROM: z.string().nonempty().optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),
});

// Validate process.env against the schema
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.errors.map((e) => e.path.join('.')).join(', ');
  throw new Error(`Missing or invalid environment variable(s): ${missing}`);
}

// Export the validated env object
module.exports = { env: parsed.data };
