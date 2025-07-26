"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleOAuth = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      console.log('Auth callback - User data:', data);
      console.log('Auth callback - Error:', error);

      if (data?.user) {
        try {
          // Sync user to your DB via API call
          const syncResponse = await fetch('/api/auth/sync-supabase', { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            console.log('User synced successfully:', syncData);
          } else {
            console.error('Failed to sync user:', await syncResponse.text());
          }
        } catch (syncError) {
          console.error('Error syncing user:', syncError);
        }

        // Redirect to home page
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          window.location.href = 'http://localhost:3000/';
        } else {
          router.replace('/');
        }
      } else {
        // No user found, redirect to home page
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          window.location.href = 'http://localhost:3000/';
        } else {
          router.replace('/');
        }
      }
    };
    handleOAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>Signing you in...</div>
    </div>
  );
} 