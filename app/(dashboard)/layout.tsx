'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserSidebar from '@/components/dashboard/UserSidebar';
import UserMainContent from '@/components/dashboard/UserMainContent';

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
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
      <UserSidebar 
        user={user as User}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <UserMainContent 
        user={user as User}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      >
        {children}
      </UserMainContent>
    </div>
  );
} 