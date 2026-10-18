import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Create a Supabase client with the given key.
 * @param key The Supabase key to use for the client.
 * @returns A Supabase client instance.
 */
function createSupabaseClient(key: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, key);
}

/**
 * Supabase client using the anon key.
 * Suitable for read-only operations if RLS is configured appropriately.
 */
export const supabaseAnon = createSupabaseClient(env.SUPABASE_ANON_KEY);

/**
 * Supabase client using the service role key.
 * Has full access to the database and should only be used in trusted server-side code.
 */
export const supabaseServiceRole = createSupabaseClient(env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Helper to get the anon client.
 */
export function getSupabaseAnonClient(): SupabaseClient {
  return supabaseAnon;
}

/**
 * Helper to get the service role client.
 */
export function getSupabaseServiceRoleClient(): SupabaseClient {
  return supabaseServiceRole;
}

/**
 * Test the connection by attempting a simple query.
 * @param client The Supabase client to use for the test.
 * @returns A message indicating the connection status.
 */
export async function testSupabaseConnection(client: SupabaseClient): Promise<string> {
  try {
    // Try to query a table that we expect to exist (knowledge_documents) to verify connectivity.
    // If the table doesn't exist yet, we'll get a 42P01 error, which we treat as a successful connection.
    await client.from('knowledge_documents').select('count').limit(1);
    return 'Connected successfully';
  } catch (err) {
    const error = err as { code?: string };
    if (error?.code === '42P01') {
      return 'Connected (knowledge_documents table not yet created)';
    }
    throw err;
  }
}