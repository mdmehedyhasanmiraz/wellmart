'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';

export default function TestAuthDebug() {
  const { user, loading, checkUser } = useAuth();
  const [authTest, setAuthTest] = useState<any>(null);
  const [apiTest, setApiTest] = useState<any>(null);
  const [envTest, setEnvTest] = useState<any>(null);
  const supabase = createClient();

  const testSupabaseAuth = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      setAuthTest({
        success: !error,
        user: authUser,
        error: error?.message
      });
    } catch (error) {
      setAuthTest({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testApiAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      setApiTest({
        success: response.ok,
        status: response.status,
        data: result
      });
    } catch (error) {
      setApiTest({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testEnvVars = async () => {
    try {
      const response = await fetch('/api/test-env');
      const result = await response.json();
      setEnvTest(result);
    } catch (error) {
      setEnvTest({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    testSupabaseAuth();
    testApiAuth();
    testEnvVars();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AuthContext State */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">AuthContext State</h2>
            <div className="space-y-2 text-sm">
              <div>Loading: <span className={loading ? 'text-yellow-600' : 'text-green-600'}>{loading ? 'Yes' : 'No'}</span></div>
              <div>User: <span className={user ? 'text-green-600' : 'text-red-600'}>{user ? 'Logged In' : 'Not Logged In'}</span></div>
              {user && (
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <div>Name: {user.name}</div>
                  <div>Email: {user.email}</div>
                  <div>Role: {user.role}</div>
                </div>
              )}
            </div>
            <button
              onClick={checkUser}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh User
            </button>
          </div>

          {/* Supabase Auth Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Supabase Auth Test</h2>
            {authTest ? (
              <div className="space-y-2 text-sm">
                <div>Success: <span className={authTest.success ? 'text-green-600' : 'text-red-600'}>{authTest.success ? 'Yes' : 'No'}</span></div>
                {authTest.error && <div>Error: <span className="text-red-600">{authTest.error}</span></div>}
                {authTest.user && (
                  <div className="mt-4 p-3 bg-gray-100 rounded">
                    <div>ID: {authTest.user.id}</div>
                    <div>Email: {authTest.user.email}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
            <button
              onClick={testSupabaseAuth}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Again
            </button>
          </div>

          {/* API Auth Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">API Auth Test</h2>
            {apiTest ? (
              <div className="space-y-2 text-sm">
                <div>Success: <span className={apiTest.success ? 'text-green-600' : 'text-red-600'}>{apiTest.success ? 'Yes' : 'No'}</span></div>
                <div>Status: {apiTest.status}</div>
                {apiTest.error && <div>Error: <span className="text-red-600">{apiTest.error}</span></div>}
                {apiTest.data && (
                  <div className="mt-4 p-3 bg-gray-100 rounded">
                    <pre className="text-xs overflow-auto">{JSON.stringify(apiTest.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
            <button
              onClick={testApiAuth}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Again
            </button>
          </div>

          {/* Environment Variables Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            {envTest ? (
              <div className="space-y-2 text-sm">
                <div>Success: <span className={envTest.success ? 'text-green-600' : 'text-red-600'}>{envTest.success ? 'Yes' : 'No'}</span></div>
                {envTest.supabaseUrl && <div>Supabase URL: <span className="text-green-600">✅ Set</span></div>}
                {envTest.supabaseAnonKey && <div>Supabase Anon Key: <span className="text-green-600">✅ Set</span></div>}
                {envTest.error && <div>Error: <span className="text-red-600">{envTest.error}</span></div>}
              </div>
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
            <button
              onClick={testEnvVars}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Again
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>1. Check if environment variables are set correctly</p>
            <p>2. Verify Supabase Auth is working</p>
            <p>3. Test the API endpoint</p>
            <p>4. Check AuthContext state</p>
            <p>5. If all tests pass but header still shows "Sign In", there might be a timing issue</p>
          </div>
        </div>
      </div>
    </div>
  );
} 