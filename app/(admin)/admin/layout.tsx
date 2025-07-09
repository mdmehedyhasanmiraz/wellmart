'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMainContent from '@/components/admin/AdminMainContent';
import type { AuthUser } from '@supabase/supabase-js';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check user role in the users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      console.log('User data:', userData); // Debug log
      console.log('User role:', userData?.role); // Debug log

      if (error || !userData) {
        console.error('User profile error:', error);
        toast.error('User profile not found. Please contact support.');
        router.push('/login');
        return;
      }

      if (!['admin', 'manager'].includes(userData.role)) {
        console.log('Access denied for role:', userData.role);
        toast.error('Access denied. Admin privileges required.');
        router.push('/not-authorized');
        return;
      }

      setUser(user);
      setUserRole(userData.role);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
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
        user={user}
        userRole={userRole}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      
      <AdminMainContent 
        user={user}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      >
        {children}
      </AdminMainContent>
    </div>
  );
} 