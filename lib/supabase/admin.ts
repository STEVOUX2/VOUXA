import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client using the Service Role key.
 * Use ONLY in server-side code (API routes, server actions, auth callbacks).
 * Never expose this to the client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
