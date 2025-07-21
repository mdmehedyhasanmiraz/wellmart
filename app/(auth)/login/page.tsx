'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
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

  // Modern segmented OTP input handler
  const handleOtpChange = (value: string, idx: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    let newOtp = otp.split('');
    newOtp[idx] = value;
    setOtp(newOtp.join('').slice(0, 6));
    if (value && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, 6);
    setOtp(pasted);
    pasted.split('').forEach((digit, idx) => {
      if (otpRefs.current[idx]) otpRefs.current[idx]!.value = digit;
    });
    if (otpRefs.current[pasted.length - 1]) otpRefs.current[pasted.length - 1]!.focus();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/90 shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="flex flex-col items-center">
          <Image src="/logos/logo-wellmart.png" alt="Wellmart Logo" width={140} height={140} className="mb-4" />
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Sign in
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
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 focus:z-10 text-base shadow-sm"
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
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 shadow-md"
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
                <div className="mt-2 flex justify-center gap-2">
                  {[0,1,2,3,4,5].map((idx) => (
                    <input
                      key={idx}
                      ref={el => { otpRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[idx] || ''}
                      onChange={e => handleOtpChange(e.target.value, idx)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                          otpRefs.current[idx-1]?.focus();
                        }
                      }}
                      className="w-12 h-12 text-center text-2xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all shadow-sm bg-white"
                      autoFocus={idx === 0}
                      aria-label={`OTP digit ${idx+1}`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600 text-center">
                  We&apos;ve sent a 6-digit code to {phone}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50"
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