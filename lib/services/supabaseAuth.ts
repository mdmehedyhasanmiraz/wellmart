import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export interface SupabaseAuthService {
  // Sync custom JWT session with Supabase using phone number
  syncWithSupabase: (phone: string) => Promise<{ success: boolean; error?: string }>;
  
  // Sign out from Supabase
  signOutFromSupabase: () => Promise<void>;
  
  // Check if Supabase session exists
  hasSupabaseSession: () => Promise<boolean>;
}

class SupabaseAuthServiceImpl implements SupabaseAuthService {
  private supabase;

  constructor() {
    this.supabase = createClientComponentClient();
  }

  async syncWithSupabase(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Syncing with Supabase for phone:', phone);

      // Use server-side sync to create/verify user exists in Supabase auth
      const response = await fetch('/api/auth/sync-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Supabase user sync successful via server');
        return { success: true };
      } else {
        console.error('Server-side sync error:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Supabase sync error:', error);
      return { success: false, error: 'Failed to sync with Supabase' };
    }
  }

  async signOutFromSupabase(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
      } else {
        console.log('✅ Signed out from Supabase');
      }
    } catch (error) {
      console.error('Supabase sign out error:', error);
    }
  }

  async hasSupabaseSession(): Promise<boolean> {
    try {
      // Check if user exists in Supabase auth by calling our sync endpoint
      const response = await fetch('/api/auth/sync-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error checking Supabase sync status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const supabaseAuthService = new SupabaseAuthServiceImpl(); 