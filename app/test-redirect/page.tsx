'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function TestRedirectPage() {
  const { user, requireAuth } = useAuth();

  useEffect(() => {
    // This page requires authentication
    requireAuth();
  }, [requireAuth]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirect Test</h1>
        <p className="text-gray-600 mb-4">
          If you can see this page, the redirect system is working correctly!
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">
            <strong>User:</strong> {user.name}
          </p>
          <p className="text-green-800">
            <strong>Email:</strong> {user.email}
          </p>
          <p className="text-green-800">
            <strong>Role:</strong> {user.role}
          </p>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          This page was protected and you were redirected here after login.
        </p>
      </div>
    </div>
  );
} 