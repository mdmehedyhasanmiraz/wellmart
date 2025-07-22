"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AdminLoginCallback() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.replace('/admin');
      } else {
        router.replace('/admin-login');
      }
    };
    check();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 to-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Signing you in...</p>
      </div>
    </div>
  );
} 