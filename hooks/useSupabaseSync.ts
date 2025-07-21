'use client';

import { useState, useEffect } from 'react';
import { supabaseAuthService } from '@/lib/services/supabaseAuth';

export const useSupabaseSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasSupabaseSession, setHasSupabaseSession] = useState<boolean | null>(null);

  // Check if Supabase session exists
  const checkSupabaseSession = async () => {
    try {
      const hasSession = await supabaseAuthService.hasSupabaseSession();
      setHasSupabaseSession(hasSession);
      return hasSession;
    } catch (error) {
      console.error('Error checking Supabase session:', error);
      setHasSupabaseSession(false);
      return false;
    }
  };

  // Sync with Supabase using phone number
  const syncWithSupabase = async (phone: string) => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      console.log('🔄 Starting Supabase sync for phone:', phone);
      
      const result = await supabaseAuthService.syncWithSupabase(phone);
      
      if (result.success) {
        console.log('✅ Supabase sync successful');
        await checkSupabaseSession();
      } else {
        console.error('❌ Supabase sync failed:', result.error);
        setSyncError(result.error || 'Failed to sync with Supabase');
      }
    } catch (error) {
      console.error('Supabase sync error:', error);
      setSyncError('An unexpected error occurred');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sign out from Supabase
  const signOutFromSupabase = async () => {
    try {
      await supabaseAuthService.signOutFromSupabase();
      setHasSupabaseSession(false);
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    }
  };

  // Check session on mount
  useEffect(() => {
    checkSupabaseSession();
  }, []);

  return {
    isSyncing,
    syncError,
    hasSupabaseSession,
    syncWithSupabase,
    signOutFromSupabase,
    checkSupabaseSession,
  };
}; 