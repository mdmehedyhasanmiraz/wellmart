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
      console.log(data);
      console.log(error);

      if (data?.user) {
        // Optionally: sync user to your DB here via API call
        // await fetch('/api/auth/sync-supabase', { method: 'POST' });
        router.replace('/dashboard');
      } else {
        router.replace('/login');
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