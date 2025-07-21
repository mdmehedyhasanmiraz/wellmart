'use client';

import { useState, useEffect } from 'react';

export default function TestDebugPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/test-auth');
      const result = await response.json();
      setAuthStatus(result);
    } catch (error) {
      setAuthStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    try {
      // Test with a simple phone number
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '01842221872' }),
      });
      const result = await response.json();
      console.log('Send OTP result:', result);
      alert('Check console for OTP result');
    } catch (error) {
      console.error('Send OTP error:', error);
      alert('Error sending OTP');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Current Auth Status:</h2>
        <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
          {JSON.stringify(authStatus, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <button 
          onClick={checkAuth}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Refresh Auth Status
        </button>
        
        <button 
          onClick={testLogin}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Send OTP
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click "Test Send OTP" to send an OTP to your phone</li>
          <li>Check the console for the OTP code</li>
          <li>Go to the login page and enter the OTP</li>
          <li>Check if you get redirected to dashboard</li>
          <li>Come back here and click "Refresh Auth Status"</li>
        </ol>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Debug Steps:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Open browser developer tools (F12)</li>
          <li>Go to Console tab</li>
          <li>Go to Application/Storage tab → Cookies</li>
          <li>Look for "wellmart_session" cookie</li>
          <li>Try the login flow and watch console logs</li>
        </ol>
      </div>
    </div>
  );
} 