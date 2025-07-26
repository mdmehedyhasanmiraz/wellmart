'use client';

import { useState } from 'react';

interface TestResult {
  status: number | string;
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export default function DebugDatabase() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string, name: string) => {
    setLoading(true);
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          ok: response.ok,
          data: data
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          status: 'ERROR',
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testAll = async () => {
    setLoading(true);
    setResults({});
    
    // Test all endpoints
    await Promise.all([
      testEndpoint('/api/test-env', 'Environment Variables'),
      testEndpoint('/api/test-db', 'Database Connection'),
      testEndpoint('/api/test-auth', 'Auth Connection'),
      testEndpoint('/api/auth/me', 'Auth Me Endpoint'),
      testEndpoint('/api/check-tables', 'Database Tables'),
      testEndpoint('/api/test-login-flow', 'Login Flow Test'),
      testEndpoint('/api/test-complete-login', 'Complete Login Test'),
    ]);
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables Check</h2>
          <div className="space-y-2 text-sm">
            <div>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Endpoint Tests</h2>
          <button
            onClick={testAll}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
          >
            {loading ? 'Testing...' : 'Test All Endpoints'}
          </button>

          <div className="space-y-4">
            {Object.entries(results).map(([name, result]) => (
              <div key={name} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{name}</h3>
                <div className="text-sm space-y-1">
                  <div>Status: <span className={result.ok ? 'text-green-600' : 'text-red-600'}>{result.status}</span></div>
                  <div>Success: <span className={result.ok ? 'text-green-600' : 'text-red-600'}>{result.ok ? 'Yes' : 'No'}</span></div>
                  {result.error && <div>Error: <span className="text-red-600">{result.error}</span></div>}
                  {result.data && (
                    <div>
                      <div>Response:</div>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Tests</h2>
          <div className="space-y-2">
            <button
              onClick={() => testEndpoint('/api/test-env', 'Environment Variables')}
              className="block w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg"
            >
              Test Environment Variables
            </button>
            <button
              onClick={() => testEndpoint('/api/test-db', 'Database Connection')}
              className="block w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg"
            >
              Test Database Connection
            </button>
            <button
              onClick={() => testEndpoint('/api/test-auth', 'Auth Connection')}
              className="block w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg"
            >
              Test Auth Connection
            </button>
            <button
              onClick={() => testEndpoint('/api/auth/me', 'Auth Me Endpoint')}
              className="block w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg"
            >
              Test Auth Me Endpoint
            </button>
            <button
              onClick={() => testEndpoint('/api/check-tables', 'Database Tables')}
              className="block w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg"
            >
              Check Database Tables
            </button>
            <button
              onClick={() => testEndpoint('/api/test-login-flow', 'Login Flow Test')}
              className="block w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg"
            >
              Test Login Flow
            </button>
            <button
              onClick={() => testEndpoint('/api/test-complete-login', 'Complete Login Test')}
              className="block w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg"
            >
              Test Complete Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 