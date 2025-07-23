'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMainContent from '@/components/admin/AdminMainContent';
import type { User } from '@supabase/supabase-js';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line
  }, []);

  const checkUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      if (!result.success || !result.user) {
        router.push('/login');
        return;
      }
      if (!['admin', 'manager'].includes(result.user.role)) {
        router.push('/not-authorized');
        return;
      }
      setUser(result.user);
    } catch (error) {
      router.push('/login');
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lime-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar 
        user={user as User | null}
        userRole={user?.role || ''}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <AdminMainContent 
        user={user as User | null}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      >
        {children}
      </AdminMainContent>
    </div>
  );
} 