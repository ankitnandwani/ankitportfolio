import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Create a single supabase client for interacting with the database
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Export a helper function to get the supabase client
export function getSupabaseClient(): SupabaseClient {
  return supabase;
}