'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function TestDbPage() {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const testDatabaseAccess = async () => {
    setIsLoading(true);
    const testResults: any = {};

    try {
      // Test 1: Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      testResults.auth = { user, error: authError };

      if (user) {
        // Test 2: Try to read from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        testResults.userQuery = { data: userData, error: userError };

        // Test 3: Try to read all users (should fail due to RLS)
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('id, email, role')
          .limit(5);
        
        testResults.allUsersQuery = { data: allUsers, error: allUsersError };

        // Test 4: Try to update user role
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', user.id)
          .select();
        
        testResults.updateQuery = { data: updateData, error: updateError };
      }

      setResults(testResults);
    } catch (error) {
      testResults.generalError = error;
      setResults(testResults);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testDatabaseAccess();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Database Access Test</h1>

          <button
            onClick={testDatabaseAccess}
            disabled={isLoading}
            className="mb-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Run Test'}
          </button>

          {results && (
            <div className="space-y-6">
              {/* Auth Test */}
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-2">Authentication Test</h2>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(results.auth, null, 2)}
                </pre>
              </div>

              {/* User Query Test */}
              {results.userQuery && (
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-2">User Query Test</h2>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(results.userQuery, null, 2)}
                  </pre>
                </div>
              )}

              {/* All Users Query Test */}
              {results.allUsersQuery && (
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-2">All Users Query Test (RLS Test)</h2>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(results.allUsersQuery, null, 2)}
                  </pre>
                </div>
              )}

              {/* Update Query Test */}
              {results.updateQuery && (
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-2">Update Query Test</h2>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(results.updateQuery, null, 2)}
                  </pre>
                </div>
              )}

              {/* General Error */}
              {results.generalError && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h2 className="text-lg font-semibold mb-2 text-red-800">General Error</h2>
                  <pre className="text-red-700 text-sm overflow-auto">
                    {JSON.stringify(results.generalError, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 