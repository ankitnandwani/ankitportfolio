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
  SUPABASE_URL: z.string().nonempty(),
  SUPABASE_ANON_KEY: z.string().nonempty(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().nonempty(),
  GITHUB_TOKEN: z.string().nonempty(),
  POSTHOG_KEY: z.string().nonempty(),
  POSTHOG_HOST: z.string().nonempty(),
  SENTRY_DSN: z.string().nonempty(),
  UPSTASH_REDIS_REST_URL: z.string().nonempty(),
  UPSTASH_REDIS_REST_TOKEN: z.string().nonempty(),
});

// Validate process.env against the schema
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.errors.map((e) => e.path.join('.')).join(', ');
  throw new Error(`Missing or invalid environment variable(s): ${missing}`);
}

// Export the validated env object
module.exports = { env: parsed.data };
