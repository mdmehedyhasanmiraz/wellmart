'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // const searchParams = useSearchParams();
  // const next = searchParams.get('next') || '/dashboard';
  const { syncWithSupabase, syncError } = useSupabaseSync();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const result = await response.json();
        
        if (result.success) {
          console.log('🔍 User already logged in, redirecting to dashboard');
          router.push('/dashboard');
        }
      } catch (error) {
        console.log('🔍 User not logged in');
        console.log(error);
      }
    };

    checkAuth();
  }, [router]);

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔍 Starting OTP verification...');
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();
      console.log('🔍 OTP verification result:', result);

      if (result.success) {
        setShowOtpInput(true);
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Phone OTP error:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔍 Starting OTP verification...');
      
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp }),
      });

      const result = await response.json();
      console.log('🔍 OTP verification result:', result);

      if (result.success) {
        console.log('🔍 Login successful, user role:', result.user.role);
        toast.success('Login successful!');
        
        // Sync with Supabase if needed
        if (result.shouldSyncSupabase) {
          console.log('🔄 Syncing with Supabase...');
          try {
            await syncWithSupabase(phone);
            if (syncError) {
              console.warn('⚠️ Supabase sync warning:', syncError);
              // Continue with redirect even if sync fails
            }
          } catch (error) {
            console.warn('⚠️ Supabase sync error:', error);
            // Continue with redirect even if sync fails
          }
        }
        
        // Always redirect to dashboard for now
        console.log('🔍 Redirecting to dashboard...');
        window.location.href = '/dashboard';
      } else {
        console.error('🔍 Login failed:', result.error);
        toast.error(result.error);
      }
    } catch (error) {
      console.error('🔍 Phone OTP verification error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowOtpInput(false);
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Wellmart
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your phone number to receive a verification code
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {/* Phone Sign In Form */}
          {!showOtpInput && (
            <form onSubmit={handlePhoneSignIn} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-lime-500 focus:border-lime-500 focus:z-10 sm:text-sm"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Enter your Bangladeshi mobile number
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          )}

          {/* OTP Verification Form */}
          {showOtpInput && (
            <form onSubmit={handlePhoneOtpVerification} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    autoComplete="one-time-code"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-lime-500 focus:border-lime-500 focus:z-10 sm:text-sm"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  We&apos;ve sent a 6-digit code to {phone}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lime-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
} 