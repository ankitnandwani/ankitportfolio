import { z } from "zod";

// Variables that must be present in every environment (server and browser).
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().nonempty(),
});

// Server-only secrets. These are never exposed to the browser, so they are
// only validated when running on the server.
const serverEnvSchema = publicEnvSchema.extend({
  GEMINI_API_KEY: z.string().nonempty(),
  GEMINI_MODEL: z.string().nonempty(),
  GEMINI_EMBEDDING_MODEL: z.string().nonempty(),
  SUPABASE_URL: z.string().nonempty(),
  SUPABASE_ANON_KEY: z.string().nonempty(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().nonempty(),
  GITHUB_TOKEN: z.string().nonempty(),
  POSTHOG_KEY: z.string().nonempty(),
  POSTHOG_HOST: z.string().nonempty(),
  SENTRY_DSN: z.string().nonempty(),
  UPSTASH_REDIS_REST_URL: z.string().nonempty(),
  UPSTASH_REDIS_REST_TOKEN: z.string().nonempty(),
  // The limits of the chat. They are optional, because the code has the
  // values PRD §48 suggests and a missing variable only means the default
  // is used.
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_DAILY_MAX: z.coerce.number().int().positive().optional(),
});

export type Env = z.infer<typeof serverEnvSchema>;

const isServer = typeof window === "undefined";

// On the client only public variables exist, so validate just those.
const parsed = isServer
  ? serverEnvSchema.safeParse(process.env)
  : publicEnvSchema.safeParse({
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    });

if (!parsed.success) {
  const missing = parsed.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");
  throw new Error(`Missing or invalid environment variable(s): ${missing}`);
}

// Server-side secrets are typed as available because client code paths that
// read them are only ever executed on the server. On the client they are
// undefined, so never rely on them from a client component.
export const env = parsed.data as Env;
