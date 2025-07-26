import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Hardcoded service role key for development (do NOT use in production)
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbHFtcHd6eGNodW94eXNlZ21jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkxMzE5MiwiZXhwIjoyMDY3NDg5MTkyfQ.MSGEwkKFc0TX2N1VV1J9s2zWAKonwU4JM98MIDVfQE4';

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
}

export const supabaseAdmin = supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export const hasAdminAccess = () => !!supabaseAdmin; 