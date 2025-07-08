'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { adminNavigation } from './adminNavigation';

interface AdminMainContentProps {
  children: React.ReactNode;
  user: any;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function AdminMainContent({ 
  children, 
  user, 
  isSidebarOpen, 
  setIsSidebarOpen 
}: AdminMainContentProps) {
  const pathname = usePathname();
  
  const currentPage = adminNavigation.find(item => item.href === pathname);

  return (
    <div className="flex-1 lg:ml-0 h-screen flex flex-col">
      {/* Top bar - Fixed */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {currentPage?.name || 'Admin'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Welcome back, {user?.user_metadata?.name || user?.email?.split('@')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Page content - Scrollable */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
} 