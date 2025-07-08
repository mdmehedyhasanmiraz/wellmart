// utils/supabase/server.ts
'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRouteHandlerClient as createRouteHandlerClientSupabase } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function createClient() {
  return createServerComponentClient({ cookies })
}

export async function createRouteHandlerClient() {
  return createRouteHandlerClientSupabase({ cookies })
} 