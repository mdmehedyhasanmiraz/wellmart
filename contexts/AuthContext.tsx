'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoginPopupOpen: boolean;
  openLoginPopup: () => void;
  closeLoginPopup: () => void;
  checkUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const supabase = createClient();

  const checkUser = async () => {
    console.log('[AuthContext] checkUser called');
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('[AuthContext] Supabase auth user:', authUser);
      console.log('[AuthContext] Auth error:', authError);
      
      if (authError) {
        console.error('[AuthContext] Auth error:', authError);
        setUser(null);
        setLoading(false);
        return;
      }
      
      if (authUser) {
        // Fetch user details from the database
        try {
          const response = await fetch('/api/auth/me');
          console.log('[AuthContext] /api/auth/me response status:', response.status);
          
          if (response.ok) {
            const result = await response.json();
            console.log('[AuthContext] /api/auth/me result:', result);
            if (result.success && result.user) {
              setUser(result.user);
            } else {
              console.error('[AuthContext] Invalid response from /api/auth/me:', result);
              setUser(null);
            }
          } else if (response.status === 404) {
            // User doesn't exist in database, try to sync them
            console.log('[AuthContext] User not found in database, attempting to sync...');
            const syncResponse = await fetch('/api/auth/sync-supabase', { 
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            if (syncResponse.ok) {
              const syncResult = await syncResponse.json();
              console.log('[AuthContext] Sync result:', syncResult);
              if (syncResult.user) {
                setUser(syncResult.user);
                console.log('[AuthContext] User synced successfully');
              } else {
                console.error('[AuthContext] No user data in sync response');
                setUser(null);
              }
            } else {
              console.error('[AuthContext] Failed to sync user:', syncResponse.status);
              setUser(null);
            }
          } else {
            console.error('[AuthContext] Error fetching user:', response.status);
            setUser(null);
          }
        } catch (fetchError) {
          console.error('[AuthContext] Fetch error:', fetchError);
          setUser(null);
        }
      } else {
        console.log('[AuthContext] No auth user found');
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const openLoginPopup = () => {
    setIsLoginPopupOpen(true);
  };

  const closeLoginPopup = () => {
    setIsLoginPopupOpen(false);
  };

  useEffect(() => {
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state change:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session?.user) {
        await checkUser();
        closeLoginPopup();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isLoginPopupOpen,
    openLoginPopup,
    closeLoginPopup,
    checkUser,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 